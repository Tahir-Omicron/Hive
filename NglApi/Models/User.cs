namespace NglApi.Models;

public class User
{
    public int Id { get; set; }

    /// <summary>Unikal istifadəçi adı (giriş üçün). Həmişə kiçik hərflərlə saxlanılır.</summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>Unikal e-poçt ünvanı. Kiçik hərflərlə saxlanılır.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>PBKDF2 hash-i: "{iterations}.{salt}.{hash}". Açıq şifrə saxlanılmır.</summary>
    public string PasswordHash { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    /// <summary>Yaş (saxlanılan dəyər, tarixdən hesablanmır).</summary>
    public int Age { get; set; }

    public string University { get; set; } = string.Empty;

    /// <summary>Fakültə — boş ola bilər.</summary>
    public string Faculty { get; set; } = string.Empty;

    /// <summary>İxtisas / ixtisaslaşma.</summary>
    public string Specialty { get; set; } = string.Empty;

    /// <summary>1-4 = bakalavr kursu, 5 = Magistr.</summary>
    public int CourseYear { get; set; }

    /// <summary>Qrup nömrəsi (məs. "2453A").</summary>
    public string GroupName { get; set; } = string.Empty;

    /// <summary>İstifadəçi adı sonuncu dəfə nə vaxt dəyişdirilib (14 günlük limit üçün).</summary>
    public DateTime? UsernameChangedAt { get; set; }

    /// <summary>
    /// Profil şəklini yolu (wwwroot-a nisbətən), məs. "uploads/avatars/ab12….jpg".
    /// Şəkil yoxdursa null — interfeys hərflə göstərir.
    /// </summary>
    public string? AvatarPath { get; set; }

    /// <summary>
    /// Təhlükəsizlik möhürü. JWT-yə "sst" claimi kimi düşür və hər sorğuda
    /// yoxlanılır. Çıxış zamanı yenilənir → bu istifadəçinin BÜTÜN köhnə
    /// tokenləri dərhal etibarsız olur (server tərəfdə ləğv).
    /// </summary>
    public string SecurityStamp { get; set; } = string.Empty;

    /// <summary>Bu hesab AI simulyasiyasıdır (real insan deyil).</summary>
    public bool IsAi { get; set; }

    /// <summary>
    /// AI-nin "personası" — hazırda sadə simulyator istifadə edir, gələcəkdə
    /// real model üçün sistem təlimatı (system prompt) kimi veriləcək.
    /// </summary>
    public string? AiPersona { get; set; }

    /// <summary>İstifadəçinin qızıl sikkələri (anonim mesaj ipucları açmaq üçün).</summary>
    public int Coins { get; set; } = 50;

    /// <summary>PRO abunəliyi — limitsiz ipucları və xüsusi nişan.</summary>
    public bool IsPro { get; set; } = false;

    /// <summary>İstifadəçinin abituriyent statusu (tələbə deyil, imtahana hazırlaşan).</summary>
    public bool IsAbituriyent { get; set; } = false;

    /// <summary>Abituriyentin hədəf ixtisas qrupu (məs. "I Qrup", "II Qrup", "III Qrup", "IV Qrup", "V Qrup").</summary>
    public string? TargetGroup { get; set; }

    public List<Message> Messages { get; set; } = [];

    public List<DirectMessage> SentMessages { get; set; } = [];

    public List<DirectMessage> ReceivedMessages { get; set; } = [];

    public List<Post> Posts { get; set; } = [];

    public List<Transaction> Transactions { get; set; } = [];

    public string FullName => $"{FirstName} {LastName}".Trim();

    /// <summary>İstifadəçi adı yenidən nə vaxt dəyişdirilə bilər (limit bitibsə null).</summary>
    public DateTime? UsernameChangeAllowedAt => UsernameChangedAt?.AddDays(14);

    /// <summary>Profil şəkli üçün xarici ünvan (yoxdursa null).</summary>
    public string? AvatarUrl => string.IsNullOrWhiteSpace(AvatarPath)
        ? null
        : (AvatarPath.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
           AvatarPath.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
            ? AvatarPath
            : "/" + AvatarPath.TrimStart('/'));
}
