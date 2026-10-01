using System.ComponentModel.DataAnnotations;

namespace NglApi.Dtos;

/// <summary>
/// Profil yeniləmə sorğusu.
/// İstifadəçi adı yalnız 14 gündə bir dəfə dəyişdirilə bilər (server yoxlayır).
/// </summary>
public class UpdateProfileRequest
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
}
