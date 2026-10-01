using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NglApi.Data;
using NglApi.Dtos;
using NglApi.Models;

namespace NglApi.Controllers;

[ApiController]
[Route("api/messages")]
public class MessagesController(AppDbContext db) : ControllerBase
{
    /// <summary>Anonim mesaj göndərir. Göndərənin cihazı və mühiti ipucu üçün qeyd olunur.</summary>
    [HttpPost]
    public async Task<IActionResult> Send([FromBody] SendMessageRequest request)
    {
        var username = request.Username.Trim().ToLowerInvariant();

        var receiver = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (receiver is null)
            return NotFound(new { error = "İstifadəçi tapılmadı." });

        var (deviceHint, locationHint) = ExtractDeviceAndLocation();

        string universityHint = "Tələbə Kampusu";
        string initialHint = "A***";

        // Əgər göndərən sistemdə daxil olubsa, onun real universitet və baş hərfini ipucu üçün saxlayırıq
        var currentUsername = User.Identity?.Name;
        if (!string.IsNullOrWhiteSpace(currentUsername))
        {
            var senderUser = await db.Users.FirstOrDefaultAsync(u => u.Username == currentUsername);
            if (senderUser is not null)
            {
                universityHint = string.IsNullOrWhiteSpace(senderUser.University) ? "Azərbaycan Universiteti" : senderUser.University;
                var charSource = !string.IsNullOrWhiteSpace(senderUser.FirstName) ? senderUser.FirstName : senderUser.Username;
                initialHint = $"{charSource[0].ToString().ToUpper()}***";
            }
        }
        else
        {
            // Daxil olmayan anonim tələbə üçün realistik tələbə ipucları
            var sampleUnis = new[] { "BDU", "ADA Universiteti", "UNEC", "ADNSU", "MAA", "AzTU", "Xəzər Universiteti" };
            var sampleLetters = new[] { "A***", "E***", "M***", "L***", "N***", "R***", "T***" };
            var randomIdx = Math.Abs(Guid.NewGuid().GetHashCode());
            universityHint = sampleUnis[randomIdx % sampleUnis.Length];
            initialHint = sampleLetters[randomIdx % sampleLetters.Length];
        }

        var message = new Message
        {
            Content = request.Content.Trim(),
            ReceiverId = receiver.Id,
            SenderIp = GetSenderIp(),
            DeviceHint = deviceHint,
            LocationHint = locationHint,
            UniversityHint = universityHint,
            SenderInitialHint = initialHint,
            ClueLevelRevealed = 0,
            CreatedAt = DateTime.UtcNow
        };

        db.Messages.Add(message);
        await db.SaveChangesAsync();

        return Ok(new { message.Id, message.CreatedAt });
    }

    /// <summary>
    /// İstifadəçiyə gələn mesajlar. JWT tələb olunur və yalnız öz gələn qutusunu görmək mümkündür.
    /// Yalnız istifadəçinin qızıl xərcləyərək açdığı ipucları qaytarılır.
    /// </summary>
    [Authorize]
    [HttpGet("{username}")]
    public async Task<ActionResult<IEnumerable<MessageResponse>>> Inbox(string username)
    {
        var key = username.Trim().ToLowerInvariant();

        if (!string.Equals(User.Identity?.Name, key, StringComparison.OrdinalIgnoreCase))
            return Forbid();

        var receiver = await db.Users.FirstOrDefaultAsync(u => u.Username == key);
        if (receiver is null)
            return NotFound(new { error = "İstifadəçi tapılmadı." });

        var messages = await db.Messages
            .Where(m => m.ReceiverId == receiver.Id)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        var response = messages.Select(MessageResponse.From).ToList();
        return Ok(response);
    }

    /// <summary>
    /// Anonim mesajın göndərəni haqqında ipucu açır (NGL Pro üslubunda monetizasiya).
    /// Level 1 (Cihaz): 10 coin
    /// Level 2 (Məkan): 20 coin
    /// Level 3 (Universitet + Baş hərf): 30 coin
    /// PRO istifadəçilər üçün pulsuzdur!
    /// </summary>
    [Authorize]
    [HttpPost("{id:int}/unlock-clue")]
    public async Task<ActionResult<UnlockClueResponse>> UnlockClue(int id, [FromBody] UnlockClueRequest request)
    {
        var currentUsername = User.Identity?.Name;
        if (string.IsNullOrWhiteSpace(currentUsername)) return Unauthorized();

        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == currentUsername);
        if (user is null) return NotFound(new { error = "İstifadəçi tapılmadı." });

        var message = await db.Messages.FirstOrDefaultAsync(m => m.Id == id && m.ReceiverId == user.Id);
        if (message is null) return NotFound(new { error = "Mesaj tapılmadı." });

        int targetLevel = Math.Clamp(request.Level, 1, 3);
        if (targetLevel <= message.ClueLevelRevealed)
        {
            // Artıq açılıb, pul çıxılmır, sadəcə məlumat qaytarılır
            return Ok(new UnlockClueResponse(
                message.Id,
                message.ClueLevelRevealed,
                message.DeviceHint,
                message.ClueLevelRevealed >= 2 ? message.LocationHint : null,
                message.ClueLevelRevealed >= 3 ? message.UniversityHint : null,
                message.ClueLevelRevealed >= 3 ? message.SenderInitialHint : null,
                user.Coins,
                user.IsPro
            ));
        }

        int cost = targetLevel switch
        {
            1 => 10,
            2 => 20,
            3 => 30,
            _ => 10
        };

        if (!user.IsPro)
        {
            if (user.Coins < cost)
            {
                return BadRequest(new
                {
                    error = $"Bu ipucunu açmaq üçün {cost} qızıl lazımdır. Balansınız: {user.Coins} qızıl. Mağazadan qızıl əldə edin."
                });
            }
            user.Coins -= cost;
        }

        message.ClueLevelRevealed = targetLevel;
        await db.SaveChangesAsync();

        return Ok(new UnlockClueResponse(
            message.Id,
            message.ClueLevelRevealed,
            message.DeviceHint,
            message.ClueLevelRevealed >= 2 ? message.LocationHint : null,
            message.ClueLevelRevealed >= 3 ? message.UniversityHint : null,
            message.ClueLevelRevealed >= 3 ? message.SenderInitialHint : null,
            user.Coins,
            user.IsPro
        ));
    }

    /// <summary>
    /// Anonim mesajı silir. Yalnız alıcı öz mesajını silə bilər.
    /// </summary>
    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var currentUsername = User.Identity?.Name;
        if (string.IsNullOrWhiteSpace(currentUsername)) return Unauthorized();

        var message = await db.Messages
            .Include(m => m.Receiver)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (message is null) return NotFound(new { error = "Mesaj tapılmadı." });

        if (!string.Equals(message.Receiver?.Username, currentUsername, StringComparison.OrdinalIgnoreCase))
            return Forbid();

        db.Messages.Remove(message);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private (string device, string location) ExtractDeviceAndLocation()
    {
        var ua = Request.Headers.UserAgent.ToString();
        string device = "Naməlum Cihaz";

        if (ua.Contains("iPhone", StringComparison.OrdinalIgnoreCase))
            device = "Apple iPhone (iOS)";
        else if (ua.Contains("iPad", StringComparison.OrdinalIgnoreCase))
            device = "Apple iPad (iPadOS)";
        else if (ua.Contains("Android", StringComparison.OrdinalIgnoreCase))
            device = "Android Smartphone";
        else if (ua.Contains("Windows", StringComparison.OrdinalIgnoreCase))
            device = "Windows PC (Masaüstü)";
        else if (ua.Contains("Macintosh", StringComparison.OrdinalIgnoreCase))
            device = "Apple Mac (macOS)";
        else if (ua.Contains("Linux", StringComparison.OrdinalIgnoreCase))
            device = "Linux PC";
        else if (!string.IsNullOrWhiteSpace(ua))
            device = "Mobil Brauzer";

        // Tələbə sosial şəbəkəsi Azərbaycan auditoriyası
        string location = "Bakı şəhəri, Azərbaycan";
        var forwarded = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded) && forwarded.Contains("sumgait", StringComparison.OrdinalIgnoreCase))
            location = "Sumqayıt, Azərbaycan";

        return (device, location);
    }

    private string GetSenderIp()
    {
        var forwarded = Request.Headers["X-Forwarded-For"].FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(forwarded))
            return forwarded.Split(',')[0].Trim();

        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}
