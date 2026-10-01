using System.ComponentModel.DataAnnotations;
using NglApi.Models;

namespace NglApi.Dtos;

public class CreatePostRequest
{
    [Required(ErrorMessage = "Paylaşım mətni boş ola bilməz.")]
    [StringLength(1000, MinimumLength = 1, ErrorMessage = "Paylaşım 1-1000 simvol arasında olmalıdır.")]
    public string Content { get; set; } = string.Empty;
}

public record PostResponse(
    int Id,
    string Content,
    DateTime CreatedAt,
    string AuthorUsername,
    string AuthorName,
    bool AuthorIsAi,
    string? AuthorAvatarUrl)
{
    public static PostResponse From(Post post) =>
        new(post.Id,
            post.Content,
            post.CreatedAt,
            post.Author?.Username ?? string.Empty,
            post.Author?.FullName ?? string.Empty,
            post.Author?.IsAi ?? false,
            post.Author?.AvatarUrl);
}
