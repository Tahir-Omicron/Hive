namespace NglApi.Dtos;

/// <summary>Register və Login-in uğurlu cavabı.</summary>
public record AuthResponse(string Token, DateTime ExpiresAt, UserProfileResponse User);
