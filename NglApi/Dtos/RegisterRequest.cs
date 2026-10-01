using System.ComponentModel.DataAnnotations;

namespace NglApi.Dtos;

public class RegisterRequest
{
    [Required(ErrorMessage = "Ad boş ola bilməz.")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "Ad 2-50 simvol arasında olmalıdır.")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Soyad boş ola bilməz.")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "Soyad 2-50 simvol arasında olmalıdır.")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "İstifadəçi adı boş ola bilməz.")]
    [StringLength(30, MinimumLength = 3, ErrorMessage = "İstifadəçi adı 3-30 simvol arasında olmalıdır.")]
    [RegularExpression("^[a-zA-Z0-9_]+$", ErrorMessage = "İstifadəçi adı yalnız hərf, rəqəm və _ simvolundan ibarət ola bilər.")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "E-poçt ünvanı boş ola bilməz.")]
    [EmailAddress(ErrorMessage = "Düzgün e-poçt ünvanı daxil edin.")]
    [StringLength(150, ErrorMessage = "E-poçt ünvanı 150 simvoldan uzun ola bilməz.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Parol boş ola bilməz.")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "Parol ən azı 8 simvol olmalıdır.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Universitet seçilməlidir.")]
    [StringLength(150, MinimumLength = 2, ErrorMessage = "Universitet adı 2-150 simvol arasında olmalıdır.")]
    public string University { get; set; } = string.Empty;

    /// <summary>Fakültə — boş ola bilər (bəzi universitetlərdə tətbiq olunmur).</summary>
    [StringLength(120, ErrorMessage = "Fakültə adı 120 simvoldan uzun ola bilməz.")]
    public string Faculty { get; set; } = string.Empty;

    [Required(ErrorMessage = "İxtisas boş ola bilməz.")]
    [StringLength(120, MinimumLength = 2, ErrorMessage = "İxtisas 2-120 simvol arasında olmalıdır.")]
    public string Specialty { get; set; } = string.Empty;

    /// <summary>0 = Abituriyent, 1-4 = bakalavr, 5 = Magistr.</summary>
    [Range(0, 5, ErrorMessage = "Kurs 0-5 arasında olmalıdır (0 = Abituriyent).")]
    public int CourseYear { get; set; }

    [Required(ErrorMessage = "Qrup nömrəsi boş ola bilməz.")]
    [StringLength(30, MinimumLength = 1, ErrorMessage = "Qrup nömrəsi 1-30 simvol arasında olmalıdır.")]
    public string GroupName { get; set; } = string.Empty;

    [Range(14, 100, ErrorMessage = "Yaş 14-100 arasında olmalıdır.")]
    public int Age { get; set; }

    public bool IsAbituriyent { get; set; } = false;

    [StringLength(50, ErrorMessage = "Hədəf qrup 50 simvoldan uzun ola bilməz.")]
    public string? TargetGroup { get; set; }
}
