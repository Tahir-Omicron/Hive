using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NglApi.Data;
using NglApi.Dtos;
using NglApi.Models;

namespace NglApi.Controllers;

[Authorize]
[ApiController]
[Route("api/wallet")]
public class WalletController(AppDbContext db) : ControllerBase
{
    private int? CurrentUserId =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int id) ? id : null;

    /// <summary>İstifadəçinin qızıl balansı və PRO statusunu qaytarır.</summary>
    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance()
    {
        if (CurrentUserId is not int userId) return Unauthorized();

        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound(new { error = "İstifadəçi tapılmadı." });

        var txCount = await db.Transactions.CountAsync(t => t.UserId == userId);

        return Ok(new
        {
            coins = user.Coins,
            isPro = user.IsPro,
            transactionsCount = txCount
        });
    }

    /// <summary>İstifadəçinin ödəniş və faktura tarixçəsi.</summary>
    [HttpGet("transactions")]
    public async Task<ActionResult<IEnumerable<TransactionDto>>> GetTransactions()
    {
        if (CurrentUserId is not int userId) return Unauthorized();

        var list = await db.Transactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(30)
            .Select(t => TransactionDto.From(t))
            .ToListAsync();

        return Ok(list);
    }

    /// <summary>
    /// Tələbə bank kartı vasitəsilə qızıl və ya PRO abunəlik alır (realist təhlükəsiz ödəniş şlüzü).
    /// </summary>
    [HttpPost("checkout")]
    public async Task<ActionResult<CheckoutResponse>> Checkout([FromBody] CheckoutRequest request)
    {
        if (CurrentUserId is not int userId) return Unauthorized();

        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound(new { error = "İstifadəçi tapılmadı." });

        decimal amount;
        int coinsToAdd;
        bool activatePro = false;
        string message;

        switch (request.PackageId?.ToLowerInvariant())
        {
            case "starter":
                amount = 1.99m;
                coinsToAdd = 100;
                message = "100 Qızıl balansınıza uğurla əlavə edildi!";
                break;

            case "popular":
                amount = 4.99m;
                coinsToAdd = 300;
                message = "300 Qızıl balansınıza uğurla əlavə edildi!";
                break;

            case "pro":
                amount = 9.99m;
                coinsToAdd = 500;
                activatePro = true;
                message = "Təbriklər! Hive PRO aktivləşdirildi və 500 bonus qızıl balansınıza yükləndi!";
                break;

            default:
                return BadRequest(new { error = "Etibarsız ödəniş paketi seçildi." });
        }

        // Maskalanmış kart nömrəsi hazırlığı
        string rawCard = request.CardNumber?.Replace(" ", "").Replace("-", "") ?? "";
        string last4 = rawCard.Length >= 4 ? rawCard[^4..] : "8842";
        string maskedCard = $"•••• •••• •••• {last4}";

        string orderId = $"HIVE-TXN-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

        var transaction = new Transaction
        {
            UserId = user.Id,
            OrderId = orderId,
            Amount = amount,
            Currency = "AZN",
            PackageId = request.PackageId.ToLowerInvariant(),
            CoinsCredited = coinsToAdd,
            ProActivated = activatePro,
            Status = "Completed",
            PaymentProvider = "HIVE Pay / AzeriCard",
            MaskedCardNumber = maskedCard,
            CreatedAt = DateTime.UtcNow
        };

        user.Coins += coinsToAdd;
        if (activatePro) user.IsPro = true;

        db.Transactions.Add(transaction);
        await db.SaveChangesAsync();

        return Ok(new CheckoutResponse(
            true,
            orderId,
            user.Coins,
            user.IsPro,
            message,
            TransactionDto.From(transaction)
        ));
    }

    /// <summary>
    /// Geriye uyğunluq üçün sürətli paket alışı.
    /// </summary>
    [HttpPost("buy-coins")]
    public async Task<ActionResult<BuyCoinsResponse>> BuyCoins([FromBody] BuyCoinsRequest request)
    {
        var checkoutResult = await Checkout(new CheckoutRequest { PackageId = request.PackageId });
        if (checkoutResult.Result is ObjectResult obj && obj.Value is not null)
        {
            return StatusCode(obj.StatusCode ?? 400, obj.Value);
        }

        if (checkoutResult.Value is CheckoutResponse res)
        {
            return Ok(new BuyCoinsResponse(res.Coins, res.IsPro, res.Message));
        }

        return BadRequest(new { error = "Ödəniş icra oluna bilmədi." });
    }
}
