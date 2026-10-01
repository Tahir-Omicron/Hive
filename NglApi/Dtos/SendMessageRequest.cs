using System.ComponentModel.DataAnnotations;

namespace NglApi.Dtos;

public class SendMessageRequest
{
    [Required(ErrorMessage = "Username boş ola bilməz.")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mesaj mətni boş ola bilməz.")]
    [StringLength(500, MinimumLength = 1, ErrorMessage = "Mesaj 1-500 simvol arasında olmalıdır.")]
    public string Content { get; set; } = string.Empty;
}
