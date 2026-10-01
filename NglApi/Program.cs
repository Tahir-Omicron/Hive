using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NglApi.Data;
using NglApi.Services;
using NglApi.Services.Ai;

var builder = WebApplication.CreateBuilder(args);

// ---------- Verilənlər Bazası: PostgreSQL (Supabase / Render) və ya SQLite (lokal) ----------
var postgresConn = builder.Configuration.GetConnectionString("Postgres")
                   ?? builder.Configuration["DATABASE_URL"]
                   ?? builder.Configuration["SUPABASE_DB_URL"];

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (!string.IsNullOrWhiteSpace(postgresConn))
    {
        string actualConn = postgresConn;
        if (postgresConn.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
            postgresConn.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uri = new Uri(postgresConn);
                var userInfo = uri.UserInfo.Split(':');
                var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "";
                var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
                var host = uri.Host;
                var port = uri.Port > 0 ? uri.Port : 5432;
                var database = uri.AbsolutePath.TrimStart('/');
                actualConn = $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
            }
            catch
            {
                actualConn = postgresConn;
            }
        }
        options.UseNpgsql(actualConn);
    }
    else
    {
        options.UseSqlite(builder.Configuration.GetConnectionString("Default")
                          ?? "Data Source=ngl.db");
    }
});

// ---------- Servislər ----------
builder.Services.AddHttpClient();
builder.Services.AddSingleton<JwtTokenService>();

// AI cavab mühərriki: HybridAiResponder (API açarı olduqda real OpenAI/OpenRouter, olmadıqda zəngin tələbə simulyatoru)
builder.Services.AddSingleton<IAiResponder, HybridAiResponder>();

// ---------- JWT autentifikasiya ----------
string jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "Jwt:Key təyin olunmayıb. appsettings.json-da və ya Jwt__Key env dəyişənində verin.");

if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
    throw new InvalidOperationException("Jwt:Key ən azı 32 bayt (simvol) olmalıdır.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };

        // Hər sorğuda təhlükəsizlik möhürü yoxlanılır. Çıxış zamanı möhür dəyişdiyi
        // üçün bu istifadəçinin köhnə tokenləri dərhal işləməz olur.
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var database = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();

                var idText = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var stamp = context.Principal?.FindFirst("sst")?.Value ?? string.Empty;

                if (!int.TryParse(idText, out int userId))
                {
                    context.Fail("Etibarsız token.");
                    return;
                }

                var current = await database.Users
                    .Where(u => u.Id == userId)
                    .Select(u => u.SecurityStamp)
                    .FirstOrDefaultAsync();

                if (current is null || !string.Equals(current, stamp, StringComparison.Ordinal))
                    context.Fail("Sessiya bitirilib. Yenidən daxil ol.");
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();

// ---------- CORS (Vercel və lokal frontend üçün) ----------
const string FrontendCorsPolicy = "FrontendCors";

var configuredOrigins = (builder.Configuration["Cors:AllowedOrigins"]
                        ?? "https://hive-frontend.vercel.app,http://localhost:3000,http://localhost:5000,http://127.0.0.1:5500")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy => policy
        .SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrWhiteSpace(origin)) return false;
            try
            {
                var uri = new Uri(origin);
                return uri.Host == "localhost"
                    || uri.Host == "127.0.0.1"
                    || uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase)
                    || configuredOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        })
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

// ---------- Baza: miqrasiyaları tətbiq et və ya cədvəlləri təmin et ----------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (db.Database.IsNpgsql())
    {
        // Supabase / Render PostgreSQL üçün avtomatik cədvəl strukturu
        db.Database.EnsureCreated();
    }
    else
    {
        // SQLite üçün miqrasiyaları icra et
        db.Database.Migrate();
    }

    // Demo hesabı (appsettings.json -> Demo:SeedAccount). İstehsalda söndürün.
    await DemoAccountSeeder.SeedAsync(db, builder.Configuration);

    // AI simulyasiya hesabları (appsettings.json -> Ai:Count). İstehsalda söndürün.
    await AiAccountSeeder.SeedAsync(db, builder.Configuration);

    // Təhlükəsizlik möhürü boş qalmış köhnə sətirləri bərpa et
    var withoutStamp = await db.Users.Where(u => u.SecurityStamp == "").ToListAsync();
    if (withoutStamp.Count > 0)
    {
        foreach (var stale in withoutStamp) stale.SecurityStamp = Guid.NewGuid().ToString("N");
        await db.SaveChangesAsync();
    }
}

// CORS, autentifikasiya və avtorizasiyadan ƏVVƏL gəlməlidir
app.UseCors(FrontendCorsPolicy);

// Giriş nöqtəsi: landingpage.html (index.html DEYİL).
// /index.html sorğuları faylın özü tərəfindən landingpage.html-ə yönləndirilir.
var defaultFiles = new DefaultFilesOptions();
defaultFiles.DefaultFileNames.Clear();
defaultFiles.DefaultFileNames.Add("landingpage.html");
app.UseDefaultFiles(defaultFiles);

// Statik faylların kodlaşdırması birmənalı olsun — sayt 4 dillidir
// (Azərbaycan, rus, türk, ingilis), ona görə charset həmişə göstərilir.
var contentTypes = new FileExtensionContentTypeProvider();
contentTypes.Mappings[".html"] = "text/html; charset=utf-8";
contentTypes.Mappings[".js"] = "text/javascript; charset=utf-8";
contentTypes.Mappings[".css"] = "text/css; charset=utf-8";
contentTypes.Mappings[".json"] = "application/json; charset=utf-8";
contentTypes.Mappings[".svg"] = "image/svg+xml; charset=utf-8";
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = contentTypes,
    OnPrepareResponse = ctx =>
    {
        // Brauzer faylın tipini "təxmin etməsin" — yüklənmiş şəkillər üçün vacibdir
        ctx.Context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    }
});

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/healthz", () => Results.Ok(new { status = "healthy", service = "Hive API", time = DateTime.UtcNow }));
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", service = "Hive API", time = DateTime.UtcNow }));

app.MapControllers();

app.Run();
