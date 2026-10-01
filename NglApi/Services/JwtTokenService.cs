using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using NglApi.Models;

namespace NglApi.Services;

/// <summary>JWT access token yaradır (imzalama: HMAC-SHA256).</summary>
public class JwtTokenService(IConfiguration configuration)
{
    public (string Token, DateTime ExpiresAt) Create(User user)
    {
        string key = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key konfiqurasiyası yoxdur.");

        int expiryHours = int.TryParse(configuration["Jwt:ExpiryHours"], out int h) ? h : 8;
        DateTime expiresAt = DateTime.UtcNow.AddHours(expiryHours);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),

                // Təhlükəsizlik möhürü: çıxış zamanı dəyişir → köhnə tokenlər etibarsız olur
                new Claim("sst", user.SecurityStamp ?? string.Empty)
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAt,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
