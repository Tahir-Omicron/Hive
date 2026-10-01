using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using NglApi.Models;

namespace NglApi.Services.Ai;

/// <summary>
/// Ağıllı AI cavablandırma servisi:
/// 1) Əgər `Ai:ApiKey` təyin olunubsa (OpenAI / OpenRouter / uyğun API), real modelə sorğu göndərir.
/// 2) Əgər API açarı hələ verilməyibsə və ya xəta baş verərsə, avtomatik zəngin tələbə simulyatoruna keçir.
/// </summary>
public sealed class HybridAiResponder(
    IConfiguration configuration,
    IHttpClientFactory httpClientFactory,
    ILogger<HybridAiResponder> logger) : IAiResponder
{
    private readonly SimulatedAiResponder _fallback = new();

    public string Name => "hybrid-ai";

    public async Task<string> GenerateReplyAsync(
        User aiAccount, User user, string userMessage, CancellationToken cancellationToken = default)
    {
        var apiKey = configuration["Ai:ApiKey"]?.Trim();
        var endpoint = configuration["Ai:ApiEndpoint"]?.Trim();
        var model = configuration["Ai:Model"]?.Trim();

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            // API key hələ daxil edilməyib — zəngin simulyasiyadan istifadə et
            return await _fallback.GenerateReplyAsync(aiAccount, user, userMessage, cancellationToken);
        }

        if (string.IsNullOrWhiteSpace(endpoint))
            endpoint = "https://api.openai.com/v1/chat/completions";

        if (string.IsNullOrWhiteSpace(model))
            model = "gpt-4o-mini";

        try
        {
            var client = httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            client.Timeout = TimeSpan.FromSeconds(25);

            var systemPrompt = $"""
                Sən Azərbaycan tələbə sosial şəbəkəsi Hive-də təhsil alan real tələbəsən.
                Adın: {aiAccount.FullName}
                Universitetin: {aiAccount.University}
                Fakültə/İxtisas: {aiAccount.Specialty}
                Kurs: {aiAccount.CourseYear}
                Persona xarakterin: {aiAccount.AiPersona ?? "mehriban, dərslərdə aktiv tələbə"}
                Danışıq tərzi: Azərbaycan dilində, gənclərin ünsiyyət dilinə uyğun, səmimi, tələbə dostu kimi yaz. Həddindən artıq rəsmi olma. Qısa və maraqlı cavab ver (maksimum 2-3 cümlə).
                """;

            var payload = new
            {
                model,
                messages = new object[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = $"{user.FullName}: {userMessage}" }
                },
                temperature = 0.7,
                max_tokens = 250
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync(endpoint, content, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                using var doc = JsonDocument.Parse(json);
                var reply = doc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                if (!string.IsNullOrWhiteSpace(reply))
                    return reply.Trim();
            }
            else
            {
                logger.LogWarning("AI API xətası: {StatusCode}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Real AI model çağırışında xəta, fallback simulyatora keçilir.");
        }

        return await _fallback.GenerateReplyAsync(aiAccount, user, userMessage, cancellationToken);
    }
}
