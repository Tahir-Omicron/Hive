using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NglApi.Data;
using NglApi.Dtos;

namespace NglApi.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController(AppDbContext db) : ControllerBase
{
    /// <summary>
    /// Paylaşılan linkdə göstərilən açıq profil.
    /// Autentifikasiya tələb olunmur; e-poçt və yaş QAYTARILMIR.
    /// 200 profile · 404
    /// </summary>
    [HttpGet("{username}")]
    public async Task<ActionResult<PublicProfileResponse>> GetPublicProfile(string username)
    {
        var key = username.Trim().ToLowerInvariant();

        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == key);
        if (user is null)
            return NotFound(new { error = "İstifadəçi tapılmadı." });

        return Ok(PublicProfileResponse.From(user));
    }

    /// <summary>
    /// İstifadəçi axtarışı — istifadəçi adı, ad və ya soyad üzrə. JWT tələb olunur.
    /// 200 [...]
    /// </summary>
    [Authorize]
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<UserSummaryResponse>>> Search(
        [FromQuery] string? q, [FromQuery] int limit = 20)
    {
        var term = (q ?? string.Empty).Trim().ToLowerInvariant();

        // Çox qısa sorğu bütün istifadəçiləri qaytarmasın
        if (term.Length < 2) return Ok(Array.Empty<UserSummaryResponse>());

        if (limit is < 1 or > 50) limit = 20;

        var users = await db.Users
            .Where(u => u.Username.Contains(term) ||
                        u.FirstName.ToLower().Contains(term) ||
                        u.LastName.ToLower().Contains(term))
            .OrderBy(u => u.Username)
            .Take(limit)
            .Select(u => new UserSummaryResponse(
                u.Username,
                (u.FirstName + " " + u.LastName).Trim(),
                u.University,
                u.CourseYear,
                u.IsAi,
                string.IsNullOrWhiteSpace(u.AvatarPath) ? null : "/" + u.AvatarPath,
                u.IsAbituriyent,
                u.TargetGroup))
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>
    /// AI simulyasiya hesablarının siyahısı (frontend-də "AI köməkçilər" bölməsi üçün).
    /// 200 [...]
    /// </summary>
    [Authorize]
    [HttpGet("ai")]
    public async Task<ActionResult<IEnumerable<UserSummaryResponse>>> AiAccounts()
    {
        var accounts = await db.Users
            .Where(u => u.IsAi)
            .OrderBy(u => u.Username)
            .Select(u => new UserSummaryResponse(
                u.Username,
                (u.FirstName + " " + u.LastName).Trim(),
                u.University,
                u.CourseYear,
                true,
                string.IsNullOrWhiteSpace(u.AvatarPath) ? null : "/" + u.AvatarPath,
                false,
                null))
            .ToListAsync();

        return Ok(accounts);
    }
}
