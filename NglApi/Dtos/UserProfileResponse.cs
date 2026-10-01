using NglApi.Models;

namespace NglApi.Dtos;

/// <summary>
/// İstifadəçinin öz profili (register/login/me/profile cavabları).
/// Qəsdən yoxdur: PasswordHash, SecurityStamp.
/// </summary>
public record UserProfileResponse(
    int Id,
    string Username,
    string Email,
    string FirstName,
    string LastName,
    int Age,
    string University,
    string Faculty,
    string Specialty,
    int CourseYear,
    string GroupName,
    bool IsAi,
    string? AvatarUrl,
    DateTime? UsernameChangedAt,
    DateTime? UsernameChangeAllowedAt,
    int Coins,
    bool IsPro,
    bool IsAbituriyent,
    string? TargetGroup)
{
    public static UserProfileResponse From(User user) =>
        new(user.Id, user.Username, user.Email, user.FirstName, user.LastName, user.Age,
            user.University, user.Faculty, user.Specialty, user.CourseYear, user.GroupName,
            user.IsAi, user.AvatarUrl, user.UsernameChangedAt, user.UsernameChangeAllowedAt,
            user.Coins, user.IsPro, user.IsAbituriyent, user.TargetGroup);
}
