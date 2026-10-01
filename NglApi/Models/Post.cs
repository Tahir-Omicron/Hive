namespace NglApi.Models;

/// <summary>Axında (feed) göstərilən paylaşım. Müəllif həm istifadəçi, həm AI ola bilər.</summary>
public class Post
{
    public int Id { get; set; }

    public int AuthorId { get; set; }
    public User? Author { get; set; }

    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
