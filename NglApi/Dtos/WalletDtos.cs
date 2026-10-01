using NglApi.Models;

namespace NglApi.Dtos;

public record TransactionDto(
    string OrderId,
    decimal Amount,
    string Currency,
    string PackageId,
    int CoinsCredited,
    bool ProActivated,
    string Status,
    string PaymentProvider,
    string MaskedCardNumber,
    DateTime CreatedAt)
{
    public static TransactionDto From(Transaction t) =>
        new(t.OrderId, t.Amount, t.Currency, t.PackageId, t.CoinsCredited,
            t.ProActivated, t.Status, t.PaymentProvider, t.MaskedCardNumber, t.CreatedAt);
}

public class CheckoutRequest
{
    public string PackageId { get; set; } = string.Empty;
    public string? CardNumber { get; set; }
    public string? CardExpiry { get; set; }
    public string? CardCvv { get; set; }
    public string? CardHolder { get; set; }
}

public record CheckoutResponse(
    bool Success,
    string OrderId,
    int Coins,
    bool IsPro,
    string Message,
    TransactionDto Transaction);
