using System.Security.Cryptography;

namespace NglApi.Services;

/// <summary>
/// PBKDF2-HMAC-SHA256 ilə şifrə hash-lənməsi.
/// Xarici paket tələb etmir; .NET-in öz kriptoqrafiya API-ləri istifadə olunur.
///
/// Format: "{iterations}.{saltBase64}.{hashBase64}"
/// İterasiya sayı hash-in içində saxlanıldığı üçün sonradan artırıla bilər —
/// köhnə hash-lər yenə düzgün yoxlanılır.
/// </summary>
public static class PasswordHasher
{
    private const int SaltSize = 16;          // 128 bit
    private const int KeySize = 32;           // 256 bit
    private const int Iterations = 210_000;   // OWASP tövsiyələrinə uyğun yüksək dəyər

    private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256;

    public static string Hash(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);
        byte[] key = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Algorithm, KeySize);

        return $"{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(key)}";
    }

    /// <summary>Şifrəni saxlanılan hash ilə müqayisə edir (sabit vaxtlı).</summary>
    public static bool Verify(string password, string storedHash)
    {
        if (string.IsNullOrWhiteSpace(storedHash)) return false;

        string[] parts = storedHash.Split('.', 3);
        if (parts.Length != 3) return false;
        if (!int.TryParse(parts[0], out int iterations) || iterations < 1) return false;

        byte[] salt, expected;
        try
        {
            salt = Convert.FromBase64String(parts[1]);
            expected = Convert.FromBase64String(parts[2]);
        }
        catch (FormatException)
        {
            return false;
        }

        if (expected.Length == 0) return false;

        byte[] actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, Algorithm, expected.Length);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
