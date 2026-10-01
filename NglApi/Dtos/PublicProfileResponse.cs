using NglApi.Models;

namespace NglApi.Dtos;

/// <summary>
/// Paylaşılan linkdə göstərilən açıq profil.
/// Qəsdən yoxdur: Email, Age, PasswordHash, SecurityStamp.
/// </summary>
public record PublicProfileResponse(
    string Username,
    string FirstName,
    string LastName,
    string University,
    string Faculty,
    string Specialty,
    int CourseYear,
    string GroupName,
    bool IsAi,
    string? AvatarUrl,
    bool IsAbituriyent,
    string? TargetGroup)
{
    public static PublicProfileResponse From(User user) =>
        new(user.Username, user.FirstName, user.LastName, user.University,
            user.Faculty, user.Specialty, user.CourseYear, user.GroupName,
            user.IsAi, user.AvatarUrl, user.IsAbituriyent, user.TargetGroup);
}
