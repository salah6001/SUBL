using Web.Api.Endpoints;

namespace Web.Api.Endpoints.Emotion;

/// <summary>
/// Keyword-based emotion analysis for the desktop agent's text input.
/// </summary>
internal sealed class AnalyzeEmotion : IEndpoint
{
    public sealed record Request(string Text, string? SessionId);

    private static readonly (string keyword, string emotion, double confidence)[] _rules =
    [
        ("anxious",     "Anxious",    0.85),
        ("anxiety",     "Anxious",    0.85),
        ("stressed",    "Stressed",   0.88),
        ("stress",      "Stressed",   0.80),
        ("overwhelmed", "Overwhelmed",0.87),
        ("tired",       "Fatigued",   0.82),
        ("exhausted",   "Fatigued",   0.88),
        ("burnout",     "Burnout",    0.90),
        ("angry",       "Frustrated", 0.84),
        ("frustrated",  "Frustrated", 0.86),
        ("sad",         "Sad",        0.80),
        ("happy",       "Happy",      0.85),
        ("great",       "Happy",      0.80),
        ("focused",     "Focused",    0.83),
        ("calm",        "Calm",       0.82),
        ("relaxed",     "Calm",       0.84),
    ];

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("emotion/analyze", (Request request) =>
        {
            string text = (request.Text ?? string.Empty).ToLowerInvariant();

            foreach (var (keyword, emotion, confidence) in _rules)
            {
                if (text.Contains(keyword))
                    return Results.Ok(new { emotion, confidence });
            }

            return Results.Ok(new { emotion = "Neutral", confidence = 0.60 });
        })
        .WithTags(Tags.Chat)
        .RequireAuthorization()
        .WithSummary("Analyze emotion from free-text input (desktop agent)");
    }
}
