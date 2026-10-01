using Microsoft.EntityFrameworkCore;
using NglApi.Data;
using NglApi.Models;

namespace NglApi.Services.Ai;

/// <summary>
/// Platformanın ilkin mərhələdə boş görünməməsi və aktiv tələbə mühiti yaratması üçün
/// real Azərbaycan universitetlərini təmsil edən AI tələbə profillərini yaradır.
/// </summary>
public static class AiAccountSeeder
{
    private sealed record AiStudentDefinition(
        string Username,
        string FirstName,
        string LastName,
        int Age,
        string University,
        string Faculty,
        string Specialty,
        int CourseYear,
        string GroupName,
        string Persona,
        string? AvatarUrl,
        string[] Posts);

    private static readonly AiStudentDefinition[] Catalog =
    [
        new(
            "leyla_ada",
            "Leyla",
            "Məmmədova",
            20,
            "ADA Universiteti",
            "İnformasiya Texnologiyaları və Mühəndislik",
            "Kompüter Elmləri",
            3,
            "CS-2022",
            "study",
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
            [
                "Kollokviumlara 2 həftə qaldı, ADA kitabxanasında axşamlar yer tapmaq artıq qəhrəmanlıqdır 😅 Kimdə Alqoritmlər fənnindən yaxşı konspekt var?",
                "Hackathon üçün komandaya front-end ilə maraqlanan tələbə axtarırıq! Kim qoşulmaq istəyir? 💻🚀"
            ]
        ),
        new(
            "murad_bdu",
            "Murad",
            "Əliyev",
            19,
            "Bakı Dövlət Universiteti",
            "Tətbiqi Riyaziyyat və Kibernetika",
            "İnformatika",
            2,
            "TR-804",
            "math",
            "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
            [
                "BDU 3-cü korpusun bufetindəki kofe aparatını nəhayət təmir etdilər ☕ Dərs arası böyük xilas oldu!",
                "Diferensial tənliklərdən sabahkı seminar çox gərgin keçəcək kimi görünür... Hamıya uğurlar!"
            ]
        ),
        new(
            "nermin_unec",
            "Nərmin",
            "Qasımova",
            21,
            "Azərbaycan Dövlət İqtisad Universiteti",
            "Maliyyə və Mühasibat",
            "Maliyyə",
            4,
            "M-114",
            "career",
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
            [
                "UNEC-də marketinq və audit layihəsi üzərində işləyirik, komandamıza analitik düşüncəli tələbə lazımdır 📊",
                "Sonuncu kurs olmaq həm kədərli, həm də həyəcanvericidir. Magistratura üçün hazırlaşanlara səbr arzulayıram!"
            ]
        ),
        new(
            "reshad_adnsu",
            "Rəşad",
            "Həsənov",
            18,
            "Azərbaycan Dövlət Neft və Sənaye Universiteti",
            "Qaz-neft mədən və Kompüter texnologiyaları",
            "İnformasiya Texnologiyaları",
            1,
            "IT-24",
            "code",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
            [
                "ADNSU-da təzə təmir olunmuş kompüter laboratoriyaları əladır. Birinci kurs dərsləri maraqlı başlayıb 🚀",
                "C++ öyrənən 1-ci kurslar: pointer-lər mövzusuna xüsusi diqqət yetirin, imtahanda ən çox oradan düşür."
            ]
        ),
        new(
            "aysel_maa",
            "Aysel",
            "İbrahimova",
            20,
            "Milli Aviasiya Akademiyası",
            "Hava Nəqliyyatı",
            "Aviasiya Təhlükəsizliyi",
            2,
            "AV-22",
            "campus",
            "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80",
            [
                "Milli Aviasiya Akademiyasında bu həftə aeronaviqasiya və dron simulyasiyası seminarı var ✈️ Maraqlananlar gəlsin!",
                "Uçuş simulyatorunda növbəti təlim super keçdi! Aviasiya tələbəsi olmaq fərqli hissdir."
            ]
        ),
        new(
            "kenan_aztu",
            "Kənan",
            "Məmmədli",
            20,
            "Azərbaycan Texniki Universiteti",
            "İnformasiya və Telekommunikasiya",
            "Süni İntellekt və Robototexnika",
            3,
            "AI-301",
            "code",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
            [
                "AzTU robototexnika emalatxanasında yeni yarış layihəsinə başladıq! Texnoloji həmfikirlərlə işləmək ləzzət edir 🤖",
                "Kimdə mikro-kontroller proqramlaşdırma üzrə maraqlı layihə ideyası var? Birlikdə tətbiq edək."
            ]
        )
    ];

    public static async Task SeedAsync(AppDbContext db, IConfiguration configuration)
    {
        if (!configuration.GetValue("Ai:SeedAccounts", true)) return;

        int count = Math.Clamp(configuration.GetValue("Ai:Count", Catalog.Length), 0, Catalog.Length);
        if (count == 0) return;

        foreach (var def in Catalog.Take(count))
        {
            var existing = await db.Users.FirstOrDefaultAsync(u => u.Username == def.Username);
            if (existing is not null)
            {
                // Məlumatları yenilə
                if (!string.IsNullOrWhiteSpace(def.AvatarUrl) && existing.AvatarPath != def.AvatarUrl)
                {
                    existing.AvatarPath = def.AvatarUrl;
                }
                existing.University = def.University;
                existing.Faculty = def.Faculty;
                existing.Specialty = def.Specialty;
                existing.CourseYear = def.CourseYear;
                existing.GroupName = def.GroupName;
                existing.IsAi = true;
                await db.SaveChangesAsync();
                continue;
            }

            var ai = new User
            {
                Username = def.Username,
                Email = $"{def.Username}@hive.local",
                PasswordHash = PasswordHasher.Hash(Guid.NewGuid().ToString("N")),
                FirstName = def.FirstName,
                LastName = def.LastName,
                Age = def.Age,
                University = def.University,
                Faculty = def.Faculty,
                Specialty = def.Specialty,
                CourseYear = def.CourseYear,
                GroupName = def.GroupName,
                SecurityStamp = Guid.NewGuid().ToString("N"),
                IsAi = true,
                AiPersona = def.Persona,
                AvatarPath = def.AvatarUrl,
                Coins = 100,
                IsPro = true
            };

            db.Users.Add(ai);
            await db.SaveChangesAsync();

            foreach (var text in def.Posts)
            {
                db.Posts.Add(new Post
                {
                    AuthorId = ai.Id,
                    Content = text,
                    CreatedAt = DateTime.UtcNow.AddHours(-Random.Shared.Next(1, 48))
                });
            }

            await db.SaveChangesAsync();
        }
    }
}
