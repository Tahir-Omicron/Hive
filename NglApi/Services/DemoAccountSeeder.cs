using Microsoft.EntityFrameworkCore;
using NglApi.Data;
using NglApi.Models;

namespace NglApi.Services;

/// <summary>
/// Demo hesabı işə salınma zamanı yaradır (artıq varsa heç nə etmir).
///
/// DİQQƏT: Bu sinif yalnız demo/test məqsədi daşıyır və parolu konfiqurasiyadan
/// oxuyur. İstehsalda `Demo:SeedAccount` dəyərini `false` edin və ya bu faylı silin.
/// </summary>
public static class DemoAccountSeeder
{
    public static async Task SeedAsync(AppDbContext db, IConfiguration configuration)
    {
        if (!configuration.GetValue("Demo:SeedAccount", true)) return;

        string username = (configuration["Demo:Username"] ?? "tahirquliyev01").Trim().ToLowerInvariant();
        string email = (configuration["Demo:Email"] ?? "omicronn020@gmail.com").Trim().ToLowerInvariant();
        string password = configuration["Demo:Password"] ?? "TahiR_2006!";

        if (await db.Users.AnyAsync(u => u.Username == username)) return;

        db.Users.Add(new User
        {
            Username = username,
            Email = email,
            PasswordHash = PasswordHasher.Hash(password),
            FirstName = configuration["Demo:FirstName"] ?? "Tahir",
            LastName = configuration["Demo:LastName"] ?? "Quliyev",
            Age = configuration.GetValue("Demo:Age", 20),
            University = configuration["Demo:University"] ?? "Milli Aviasiya Akademiyası",
            Faculty = configuration["Demo:Faculty"] ?? string.Empty,
            Specialty = configuration["Demo:Specialty"] ?? string.Empty,
            CourseYear = configuration.GetValue("Demo:CourseYear", 4),
            GroupName = configuration["Demo:GroupName"] ?? "2453A",
            SecurityStamp = Guid.NewGuid().ToString("N")
        });

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // E-poçt başqa hesabda istifadə olunursa işə salınmanı dayandırmırıq
        }
    }
}
