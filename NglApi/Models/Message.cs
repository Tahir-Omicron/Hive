namespace NglApi.Models;

public class Message
{
    public int Id { get; set; }

    public string Content { get; set; } = string.Empty;

    public int ReceiverId { get; set; }

    public User? Receiver { get; set; }

    /// <summary>
    /// Göndərənin IP-si server tərəfindən avtomatik doldurulur.
    /// Yalnız daxili saxlanılır — heç bir API cavabında qaytarılmır.
    /// </summary>
    public string SenderIp { get; set; } = string.Empty;

    /// <summary>Cihaz ipucu (User-Agent əsasında: məs. "iPhone (iOS 17)", "Android")</summary>
    public string DeviceHint { get; set; } = string.Empty;

    /// <summary>Məkan ipucu (təxmini: məs. "Bakı şəhəri, Azərbaycan")</summary>
    public string LocationHint { get; set; } = string.Empty;

    /// <summary>Universitet ipucu (məs. "ADA Universiteti", "BDU")</summary>
    public string UniversityHint { get; set; } = string.Empty;

    /// <summary>Göndərənin baş hərfi (məs. "L***")</summary>
    public string SenderInitialHint { get; set; } = string.Empty;

    /// <summary>Açılmış ipucu səviyyəsi: 0 = heç biri, 1 = Cihaz, 2 = Cihaz+Məkan, 3 = Tam</summary>
    public int ClueLevelRevealed { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
