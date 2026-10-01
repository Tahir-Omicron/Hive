using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NglApi.Data;
using NglApi.Dtos;
using NglApi.Models;
using NglApi.Services.Ai;

namespace NglApi.Controllers;

/// <summary>Direct (şəxsi) mesajlaşma. Bütün endpoint-lər JWT tələb edir.</summary>
[ApiController]
[Route("api/dm")]
[Authorize]
public class DirectController(AppDbContext db, IAiResponder aiResponder) : ControllerBase
{
    private int? CurrentUserId =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int id) ? id : null;

    /// <summary>Mesaj göndərir. 200 message · 400 · 404</summary>
    [HttpPost]
    public async Task<ActionResult<DirectMessageResponse>> Send([FromBody] SendDirectRequest request)
    {
        if (CurrentUserId is not int me) return Unauthorized();

        var username = request.Username.Trim().ToLowerInvariant();
        var receiver = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (receiver is null) return NotFound(new { error = "İstifadəçi tapılmadı." });
        if (receiver.Id == me) return BadRequest(new { error = "Özünə mesaj göndərə bilməzsən." });

        var sender = await db.Users.FindAsync(me);
        if (sender is null) return Unauthorized();

        var message = new DirectMessage
        {
            SenderId = me,
            ReceiverId = receiver.Id,
            Content = request.Content.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        db.DirectMessages.Add(message);
        await db.SaveChangesAsync();

        // Qarşı tərəf AI hesabıdırsa cavab avtomatik yaradılır.
        // Real modelə keçid üçün yalnız IAiResponder implementasiyası dəyişir.
        if (receiver.IsAi)
        {
            var replyText = await aiResponder.GenerateReplyAsync(receiver, sender, message.Content);

            db.DirectMessages.Add(new DirectMessage
            {
                SenderId = receiver.Id,
                ReceiverId = me,
                Content = replyText,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            });

            await db.SaveChangesAsync();
        }

        message.Sender = sender;
        message.Receiver = receiver;

        return Ok(DirectMessageResponse.From(message, me));
    }

    /// <summary>
    /// Bir istifadəçi ilə olan söhbət (hər iki istiqamət), köhnədən yeniyə.
    /// Gələn oxunmamış mesajlar oxunmuş kimi işarələnir.
    /// </summary>
    [HttpGet("{username}")]
    public async Task<ActionResult<IEnumerable<DirectMessageResponse>>> Thread(string username)
    {
        if (CurrentUserId is not int me) return Unauthorized();

        var key = username.Trim().ToLowerInvariant();
        var other = await db.Users.FirstOrDefaultAsync(u => u.Username == key);
        if (other is null) return NotFound(new { error = "İstifadəçi tapılmadı." });

        var messages = await db.DirectMessages
            .Where(m => (m.SenderId == me && m.ReceiverId == other.Id) ||
                        (m.SenderId == other.Id && m.ReceiverId == me))
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        bool changed = false;
        foreach (var m in messages.Where(m => m.ReceiverId == me && !m.IsRead))
        {
            m.IsRead = true;
            changed = true;
        }
        if (changed) await db.SaveChangesAsync();

        return Ok(messages.Select(m => DirectMessageResponse.From(m, me)));
    }

    /// <summary>Söhbət siyahısı: son mesaj, vaxt və oxunmamış sayı.</summary>
    [HttpGet("conversations")]
    public async Task<ActionResult<IEnumerable<ConversationResponse>>> Conversations()
    {
        if (CurrentUserId is not int me) return Unauthorized();

        // Demo miqyası üçün qruplaşdırma yaddaşda aparılır;
        // böyük həcmdə bunu DB tərəfində (GROUP BY) etmək lazımdır.
        var all = await db.DirectMessages
            .Where(m => m.SenderId == me || m.ReceiverId == me)
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        var conversations = all
            .GroupBy(m => m.SenderId == me ? m.ReceiverId : m.SenderId)
            .Select(g =>
            {
                var last = g.First();
                var partner = last.SenderId == me ? last.Receiver : last.Sender;
                return new ConversationResponse(
                    partner?.Username ?? string.Empty,
                    partner?.FullName ?? string.Empty,
                    last.Content,
                    last.CreatedAt,
                    g.Count(m => m.ReceiverId == me && !m.IsRead),
                    last.SenderId == me,
                    partner?.IsAi ?? false,
                    partner?.AvatarUrl);
            })
            .ToList();

        return Ok(conversations);
    }
}
