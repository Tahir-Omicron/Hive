using NglApi.Models;

namespace NglApi.Dtos;

/// <summary>
/// Xarici cavab modeli. SenderIp burada qəsdən yoxdur —
/// IP heç vaxt API cavabına düşməməlidir.
/// Yalnız istifadəçinin qızıl xərcləyərək açdığı ipucları qaytarılır.
/// </summary>
public record MessageResponse(
    int Id,
    string Content,
    DateTime CreatedAt,
    int ClueLevelRevealed,
    string? DeviceHint = null,
    string? LocationHint = null,
    string? UniversityHint = null,
    string? SenderInitialHint = null)
{
    public static MessageResponse From(Message m)
    {
        return new MessageResponse(
            m.Id,
            m.Content,
            m.CreatedAt,
            m.ClueLevelRevealed,
            m.ClueLevelRevealed >= 1 ? m.DeviceHint : null,
            m.ClueLevelRevealed >= 2 ? m.LocationHint : null,
            m.ClueLevelRevealed >= 3 ? m.UniversityHint : null,
            m.ClueLevelRevealed >= 3 ? m.SenderInitialHint : null
        );
    }
}

public record UnlockClueRequest(int Level);

public record UnlockClueResponse(
    int MessageId,
    int ClueLevel,
    string? DeviceHint,
    string? LocationHint,
    string? UniversityHint,
    string? SenderInitialHint,
    int RemainingCoins,
    bool IsPro);

public record BuyCoinsRequest(string PackageId);

public record BuyCoinsResponse(
    int Coins,
    bool IsPro,
    string Message);
