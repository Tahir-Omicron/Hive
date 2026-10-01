using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NglApi.Data;
using NglApi.Dtos;
using NglApi.Models;

namespace NglApi.Controllers;

/// <summary>Axın (feed) paylaşımları. Müəllif istifadəçi və ya AI hesabı ola bilər.</summary>
[ApiController]
[Route("api/posts")]
[Authorize]
public class PostsController(AppDbContext db) : ControllerBase
{
    private int? CurrentUserId =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int id) ? id : null;

    /// <summary>Axın: ən yeni paylaşımlar. 200 [...]</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PostResponse>>> Feed([FromQuery] int take = 30)
    {
        if (take is < 1 or > 100) take = 30;

        var posts = await db.Posts
            .Include(p => p.Author)
            .OrderByDescending(p => p.CreatedAt)
            .Take(take)
            .ToListAsync();

        return Ok(posts.Select(PostResponse.From));
    }

    /// <summary>Yeni paylaşım yaradır. 200 post · 400</summary>
    [HttpPost]
    public async Task<ActionResult<PostResponse>> Create([FromBody] CreatePostRequest request)
    {
        if (CurrentUserId is not int me) return Unauthorized();

        var author = await db.Users.FindAsync(me);
        if (author is null) return Unauthorized();

        var post = new Post
        {
            AuthorId = me,
            Content = request.Content.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        db.Posts.Add(post);
        await db.SaveChangesAsync();

        post.Author = author;
        return Ok(PostResponse.From(post));
    }

    /// <summary>Bir istifadəçinin paylaşımları. 200 [...]</summary>
    [HttpGet("user/{username}")]
    public async Task<ActionResult<IEnumerable<PostResponse>>> ByUser(string username)
    {
        var key = username.Trim().ToLowerInvariant();

        var posts = await db.Posts
            .Include(p => p.Author)
            .Where(p => p.Author!.Username == key)
            .OrderByDescending(p => p.CreatedAt)
            .Take(50)
            .ToListAsync();

        return Ok(posts.Select(PostResponse.From));
    }

    /// <summary>Paylaşımı silir. Yalnız müəllif öz paylaşımını silə bilər. 204 · 401 · 403 · 404</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (CurrentUserId is not int me) return Unauthorized();

        var post = await db.Posts.FindAsync(id);
        if (post is null) return NotFound(new { error = "Paylaşım tapılmadı." });

        if (post.AuthorId != me) return Forbid();

        db.Posts.Remove(post);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
