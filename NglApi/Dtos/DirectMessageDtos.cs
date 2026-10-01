using System.ComponentModel.DataAnnotations;
using NglApi.Models;

namespace NglApi.Dtos;

public class SendDirectRequest
{
    [Required(ErrorMessage = "Alıcı seçilməlidir.")]
    [StringLength(30, ErrorMessage = "İstifadəçi adı 30 simvoldan uzun ola bilməz.")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mesaj boş ola bilməz.")]
    [StringLength(1000, MinimumLength = 1, ErrorMessage = "Mesaj 1-1000 simvol arasında olmalıdır.")]
    public string Content { get; set; } = string.Empty;
}

/// <summary>Thread-də bir mesaj. Göndərənin yalnız istifadəçi adı göstərilir.</summary>
public record DirectMessageResponse(
    int Id,
    string Content,
    DateTime CreatedAt,
    string SenderUsername,
    string ReceiverUsername,
    bool IsMine)
{
    public static DirectMessageResponse From(DirectMessage m, int currentUserId) =>
        new(m.Id, m.Content, m.CreatedAt,
            m.Sender?.Username ?? string.Empty,
            m.Receiver?.Username ?? string.Empty,
            m.SenderId == currentUserId);
}

/// <summary>Direct bölməsindəki söhbət siyahısı üçün.</summary>
public record ConversationResponse(
    string Username,
    string FullName,
    string LastMessage,
    DateTime LastMessageAt,
    int UnreadCount,
    bool LastMessageIsMine,
    bool PartnerIsAi,
    string? AvatarUrl);
