using Microsoft.EntityFrameworkCore;
using NglApi.Models;

namespace NglApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<DirectMessage> DirectMessages => Set<DirectMessage>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Transaction> Transactions => Set<Transaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.Property(u => u.Username).IsRequired().HasMaxLength(30);
            e.HasIndex(u => u.Username).IsUnique();

            e.Property(u => u.Email).IsRequired().HasMaxLength(150);
            e.HasIndex(u => u.Email).IsUnique();

            e.Property(u => u.PasswordHash).IsRequired().HasMaxLength(200);

            e.Property(u => u.FirstName).IsRequired().HasMaxLength(50);
            e.Property(u => u.LastName).IsRequired().HasMaxLength(50);

            e.Property(u => u.University).IsRequired().HasMaxLength(150);
            e.Property(u => u.Faculty).HasMaxLength(120);          // boş ola bilər
            e.Property(u => u.Specialty).IsRequired().HasMaxLength(120);
            e.Property(u => u.GroupName).IsRequired().HasMaxLength(30);

            e.Property(u => u.AiPersona).HasMaxLength(120);
            e.HasIndex(u => u.IsAi);

            // Profil şəkli: wwwroot/uploads/avatars/<təsadüfi ad>.<ext>
            e.Property(u => u.AvatarPath).HasMaxLength(300);

            // Təhlükəsizlik möhürü — JWT ləğvi üçün
            e.Property(u => u.SecurityStamp).IsRequired().HasMaxLength(64);

            e.Property(u => u.Coins).HasDefaultValue(50);
            e.Property(u => u.IsPro).HasDefaultValue(false);
            e.Property(u => u.IsAbituriyent).HasDefaultValue(false);
            e.Property(u => u.TargetGroup).HasMaxLength(50);
        });

        modelBuilder.Entity<Message>(e =>
        {
            e.Property(m => m.Content).IsRequired().HasMaxLength(500);
            e.Property(m => m.SenderIp).IsRequired().HasMaxLength(45);
            e.Property(m => m.DeviceHint).HasMaxLength(120).HasDefaultValue("");
            e.Property(m => m.LocationHint).HasMaxLength(120).HasDefaultValue("");
            e.Property(m => m.UniversityHint).HasMaxLength(150).HasDefaultValue("");
            e.Property(m => m.SenderInitialHint).HasMaxLength(20).HasDefaultValue("");
            e.Property(m => m.ClueLevelRevealed).HasDefaultValue(0);

            e.Property(m => m.CreatedAt).HasConversion(
                v => v,
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            e.HasOne(m => m.Receiver)
             .WithMany(u => u.Messages)
             .HasForeignKey(m => m.ReceiverId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DirectMessage>(e =>
        {
            e.Property(m => m.Content).IsRequired().HasMaxLength(1000);

            e.Property(m => m.CreatedAt).HasConversion(
                v => v,
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            e.HasOne(m => m.Sender)
             .WithMany(u => u.SentMessages)
             .HasForeignKey(m => m.SenderId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(m => m.Receiver)
             .WithMany(u => u.ReceivedMessages)
             .HasForeignKey(m => m.ReceiverId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(m => new { m.SenderId, m.ReceiverId });
        });

        modelBuilder.Entity<Post>(e =>
        {
            e.Property(p => p.Content).IsRequired().HasMaxLength(1000);

            e.Property(p => p.CreatedAt).HasConversion(
                v => v,
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            e.HasOne(p => p.Author)
             .WithMany(u => u.Posts)
             .HasForeignKey(p => p.AuthorId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(p => p.CreatedAt);
        });

        modelBuilder.Entity<Transaction>(e =>
        {
            e.Property(t => t.OrderId).IsRequired().HasMaxLength(64);
            e.HasIndex(t => t.OrderId).IsUnique();

            e.Property(t => t.Amount).HasColumnType("TEXT"); // SQLite decimal storage
            e.Property(t => t.Currency).HasMaxLength(10).HasDefaultValue("AZN");
            e.Property(t => t.PackageId).IsRequired().HasMaxLength(50);
            e.Property(t => t.Status).IsRequired().HasMaxLength(30);
            e.Property(t => t.PaymentProvider).HasMaxLength(50);
            e.Property(t => t.MaskedCardNumber).HasMaxLength(30);

            e.Property(t => t.CreatedAt).HasConversion(
                v => v,
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            e.HasOne(t => t.User)
             .WithMany(u => u.Transactions)
             .HasForeignKey(t => t.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(t => t.CreatedAt);
        });
    }
}
