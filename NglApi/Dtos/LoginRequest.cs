using System.ComponentModel.DataAnnotations;

namespace NglApi.Dtos;

public class LoginRequest
{
    [Required(ErrorMessage = "İstifadəçi adı boş ola bilməz.")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Şifrə boş ola bilməz.")]
    public string Password { get; set; } = string.Empty;
}
