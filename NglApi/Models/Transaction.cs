namespace NglApi.Models;

/// <summary>
/// Sistemdə həyata keçirilən təhlükəsiz ödəniş və sikkə alış əməliyyatları jurnalı.
/// </summary>
public class Transaction
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public User? User { get; set; }

    /// <summary>Unikal ödəniş faktura nömrəsi, məs: "HIVE-TXN-20261001-A9F2"</summary>
    public string OrderId { get; set; } = string.Empty;

    /// <summary>Ödənilən məbləğ (AZN)</summary>
    public decimal Amount { get; set; }

    public string Currency { get; set; } = "AZN";

    public string PackageId { get; set; } = string.Empty;

    public int CoinsCredited { get; set; }

    public bool ProActivated { get; set; }

    /// <summary>Status: Completed, Pending, Failed</summary>
    public string Status { get; set; } = "Completed";

    public string PaymentProvider { get; set; } = "BankCard";

    public string MaskedCardNumber { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
