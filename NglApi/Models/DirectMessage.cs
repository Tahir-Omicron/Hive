namespace NglApi.Models;

/// <summary>İstifadəçilər arasında birbaşa (Direct) mesaj.</summary>
public class DirectMessage
{
    public int Id { get; set; }

    public int SenderId { get; set; }
    public User? Sender { get; set; }

    public int ReceiverId { get; set; }
    public User? Receiver { get; set; }

    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Alıcı oxuyubmu (oxunmamış sayı üçün).</summary>
    public bool IsRead { get; set; }
}
