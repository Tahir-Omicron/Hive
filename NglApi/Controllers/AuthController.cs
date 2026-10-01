using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NglApi.Data;
using NglApi.Dtos;
using NglApi.Models;
using NglApi.Services;

namespace NglApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, JwtTokenService tokens, IWebHostEnvironment env, IConfiguration config)
    : ControllerBase
{
    /// <summary>İstifadəçi adı dəyişdirmə limiti (gün).</summary>
    private const int UsernameCooldownDays = 14;

    /// <summary>Qəbul edilən şəkil formatları.</summary>
    private static readonly HashSet<string> AllowedImageTypes =
        new(StringComparer.OrdinalIgnoreCase) { "image/jpeg", "image/png", "image/webp" };

    /// <summary>
    /// Login zamanı istifadəçi tapılmasa belə hash yoxlaması aparılır ki,
    /// cavab vaxtına görə istifadəçi adının mövcudluğu bilinməsin (timing attack).
    /// </summary>
    private static readonly string DummyHash = PasswordHasher.Hash("timing-attack-dummy-password");

    private int? CurrentUserId =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int id) ? id : null;

    /// <summary>Yeni istifadəçi yaradır. 200 auth · 400 validasiya · 409 təkrar</summary>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        var username = request.Username.Trim().ToLowerInvariant();
        var email = request.Email.Trim().ToLowerInvariant();

        if (await db.Users.AnyAsync(u => u.Username == username))
            return Conflict(new { error = "Bu istifadəçi adı artıq mövcuddur.", field = "username" });

        if (await db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { error = "Bu e-poçt ilə hesab artıq mövcuddur.", field = "email" });

        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = PasswordHasher.Hash(request.Password),   // yalnız hash saxlanılır
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Age = request.Age,
            University = request.University.Trim(),
            Faculty = request.Faculty.Trim(),
            Specialty = request.Specialty.Trim(),
            CourseYear = request.CourseYear,
            GroupName = request.GroupName.Trim(),
            IsAbituriyent = request.IsAbituriyent,
            TargetGroup = request.TargetGroup?.Trim(),
            SecurityStamp = Guid.NewGuid().ToString("N")
        };

        db.Users.Add(user);

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Yarış vəziyyəti: unikal indeks işə düşdü
            return Conflict(new { error = "Bu istifadəçi adı və ya e-poçt artıq mövcuddur.", field = "" });
        }

        var (token, expiresAt) = tokens.Create(user);
        return Ok(new AuthResponse(token, expiresAt, UserProfileResponse.From(user)));
    }

    /// <summary>Giriş. 200 auth · 401</summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var username = request.Username.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);

        var passwordOk = PasswordHasher.Verify(request.Password, user?.PasswordHash ?? DummyHash);

        if (user is null || !passwordOk)
            return Unauthorized(new { error = "İstifadəçi adı və ya şifrə yanlışdır." });

        // Köhnə sətirlərdə möhür boş ola bilər — bərpa edirik
        if (string.IsNullOrWhiteSpace(user.SecurityStamp))
        {
            user.SecurityStamp = Guid.NewGuid().ToString("N");
            await db.SaveChangesAsync();
        }

        var (token, expiresAt) = tokens.Create(user);
        return Ok(new AuthResponse(token, expiresAt, UserProfileResponse.From(user)));
    }

    /// <summary>Cari istifadəçinin profili. 200 · 401</summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserProfileResponse>> Me()
    {
        if (CurrentUserId is not int userId) return Unauthorized();

        var user = await db.Users.FindAsync(userId);
        if (user is null) return Unauthorized();

        return Ok(UserProfileResponse.From(user));
    }

    /// <summary>
    /// Hesabdan çıxış. Serverdə <see cref="User.SecurityStamp"/> yenilənir →
    /// bu istifadəçiyə verilmiş BÜTÜN mövcud tokenlər dərhal etibarsız olur.
    /// 204
    /// </summary>
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        if (CurrentUserId is not int userId) return Unauthorized();

        var user = await db.Users.FindAsync(userId);
        if (user is null) return Unauthorized();

        user.SecurityStamp = Guid.NewGuid().ToString("N");
        await db.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Profil şəklini yükləyir (multipart/form-data, sahə adı: file).
    /// Format və ölçü yoxlanılır, fayl təsadüfi adla saxlanılır, köhnə şəkil silinir.
    /// 200 user · 400 · 401
    /// </summary>
    [Authorize]
    [HttpPost("avatar")]
    [RequestSizeLimit(4 * 1024 * 1024)]
    public async Task<ActionResult<UserProfileResponse>> UploadAvatar(IFormFile? file)
    {
        if (CurrentUserId is not int userId) return Unauthorized();

        var user = await db.Users.FindAsync(userId);
        if (user is null) return Unauthorized();

        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Şəkil seçilməyib." });

        long maxBytes = config.GetValue("Avatar:MaxBytes", 2 * 1024 * 1024);
        if (file.Length > maxBytes)
            return BadRequest(new { error = $"Şəkil ölçüsü {maxBytes / (1024 * 1024)} MB-dan çox ola bilməz." });

        if (!AllowedImageTypes.Contains(file.ContentType))
            return BadRequest(new { error = "Yalnız JPEG, PNG və ya WEBP formatı qəbul olunur." });

        // MIME tipinə etibar etmirik — faylın ilk baytlarına baxırıq.
        // (Bu, adını dəyişdirilmiş skript və ya SVG kimi faylların qarşısını alır.)
        var extension = await DetectImageExtension(file);
        if (extension is null)
            return BadRequest(new { error = "Fayl düzgün şəkil deyil." });

        var uploadsRoot = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads", "avatars");
        Directory.CreateDirectory(uploadsRoot);

        // Fayl adı server tərəfdə yaradılır → istifadəçinin göndərdiyi ad heç vaxt istifadə olunmur
        var fileName = Guid.NewGuid().ToString("N") + extension;
        var fullPath = Path.Combine(uploadsRoot, fileName);

        await using (var target = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(target);
        }

        RemoveOldAvatar(user, uploadsRoot);

        user.AvatarPath = $"uploads/avatars/{fileName}";
        await db.SaveChangesAsync();

        return Ok(UserProfileResponse.From(user));
    }

    /// <summary>Profil şəklini silir (istəyə bağlı). 200 user</summary>
    [Authorize]
    [HttpDelete("avatar")]
    public async Task<ActionResult<UserProfileResponse>> DeleteAvatar()
    {
        if (CurrentUserId is not int userId) return Unauthorized();

        var user = await db.Users.FindAsync(userId);
        if (user is null) return Unauthorized();

        var uploadsRoot = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads", "avatars");
        RemoveOldAvatar(user, uploadsRoot);

        user.AvatarPath = null;
        await db.SaveChangesAsync();

        return Ok(UserProfileResponse.From(user));
    }

    /// <summary>
    /// Profili yeniləyir: ad, soyad və istifadəçi adı.
    /// İstifadəçi adı yalnız 14 gündə bir dəfə dəyişdirilə bilər.
    /// 200 user · 400 (limit/validasiya) · 409 (ad tutulub)
    /// </summary>
    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<UserProfileResponse>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        if (CurrentUserId is not int userId) return Unauthorized();

        var user = await db.Users.FindAsync(userId);
        if (user is null) return Unauthorized();

        var newUsername = request.Username.Trim().ToLowerInvariant();

        // Yalnız həqiqətən dəyişirsə limit yoxlanılır — eyni adı yadda saxlamaq limiti yemir
        bool usernameChanging = !string.Equals(user.Username, newUsername, StringComparison.Ordinal);

        if (usernameChanging)
        {
            if (user.UsernameChangeAllowedAt is DateTime allowedAt && allowedAt > DateTime.UtcNow)
            {
                int daysLeft = (int)Math.Ceiling((allowedAt - DateTime.UtcNow).TotalDays);

                return BadRequest(new
                {
                    error = $"İstifadəçi adını yalnız {UsernameCooldownDays} gündə bir dəfə dəyişmək mümkündür. " +
                            $"Növbəti dəyişiklik {allowedAt:dd.MM.yyyy} tarixindən sonra olacaq ({daysLeft} gün sonra).",
                    field = "username",
                    usernameChangeAllowedAt = allowedAt
                });
            }

            bool taken = await db.Users.AnyAsync(u => u.Username == newUsername && u.Id != userId);
            if (taken)
                return Conflict(new { error = "Bu istifadəçi adı artıq mövcuddur.", field = "username" });

            user.Username = newUsername;
            user.UsernameChangedAt = DateTime.UtcNow;
        }

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { error = "Bu istifadəçi adı artıq mövcuddur.", field = "username" });
        }

        return Ok(UserProfileResponse.From(user));
    }

    /* ---------------- köməkçilər ---------------- */

    /// <summary>Faylın ilk baytlarına görə həqiqi formatını təyin edir.</summary>
    private static async Task<string?> DetectImageExtension(IFormFile file)
    {
        var header = new byte[12];
        await using var stream = file.OpenReadStream();

        int read = await stream.ReadAsync(header.AsMemory(0, header.Length));
        if (read < 12) return null;

        if (header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF) return ".jpg";
        if (header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47) return ".png";
        if (header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46 &&
            header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50) return ".webp";

        return null;
    }

    /// <summary>Köhnə profil şəklini diskdən silir (yol mütləq uploads qovluğunda olmalıdır).</summary>
    private static void RemoveOldAvatar(User user, string uploadsRoot)
    {
        if (string.IsNullOrWhiteSpace(user.AvatarPath)) return;

        try
        {
            var oldPath = Path.GetFullPath(Path.Combine(uploadsRoot, Path.GetFileName(user.AvatarPath)));
            var root = Path.GetFullPath(uploadsRoot) + Path.DirectorySeparatorChar;

            // Qoruyucu: yalnız uploads/avatars qovluğundakı fayl silinə bilər
            if (oldPath.StartsWith(root, StringComparison.OrdinalIgnoreCase) && System.IO.File.Exists(oldPath))
                System.IO.File.Delete(oldPath);
        }
        catch
        {
            // Silinmə alınmasa yükləmə yenə də uğurlu sayılır
        }
    }
}
