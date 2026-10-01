using NglApi.Models;

namespace NglApi.Services.Ai;

/// <summary>
/// AI hesabının cavabını yaradan müqavilə.
///
/// Hazırda yeganə implementasiya <see cref="SimulatedAiResponder"/>-dir (şablon əsaslı
/// simulyasiya). Real modelə keçid üçün bu interfeysi implement edən yeni sinif yazıb
/// <c>Program.cs</c>-də qeydiyyatı dəyişmək kifayətdir — controller-lər və frontend
/// heç bir dəyişiklik tələb etmir.
/// </summary>
public interface IAiResponder
{
    /// <summary>İstifadə olunan mühərrikin adı (diaqnostika üçün).</summary>
    string Name { get; }

    /// <summary>
    /// AI hesabı üçün cavab yaradır.
    /// </summary>
    /// <param name="aiAccount">Cavab verən AI hesabı (personası buradadır).</param>
    /// <param name="user">Mesajı göndərən istifadəçi.</param>
    /// <param name="userMessage">İstifadəçinin mesajı.</param>
    /// <param name="cancellationToken">Ləğv tokeni.</param>
    Task<string> GenerateReplyAsync(
        User aiAccount, User user, string userMessage, CancellationToken cancellationToken = default);
}
