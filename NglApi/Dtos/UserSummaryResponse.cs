using NglApi.Models;

namespace NglApi.Dtos;

/// <summary>Axtarış nəticələrində göstərilən qısa profil.</summary>
public record UserSummaryResponse(
    string Username,
    string FullName,
    string University,
    int CourseYear,
    bool IsAi,
    string? AvatarUrl,
    bool IsAbituriyent,
    string? TargetGroup)
{
    public static UserSummaryResponse From(User user) =>
        new(user.Username, user.FullName, user.University, user.CourseYear, user.IsAi, user.AvatarUrl, user.IsAbituriyent, user.TargetGroup);
}
