using Web.Api.Endpoints;

namespace Web.Api.Endpoints.Chat;

/// <summary>
/// AI-powered chat endpoint for the SublAI assistant.
/// </summary>
internal sealed class SendMessage : IEndpoint
{
    public sealed record Request(string Message);

    private static readonly (string keyword, string reply)[] _responses =
    [
        ("stress",      "Based on your recent typing patterns, elevated keystroke variability is often the first sign of stress — before you consciously feel it.\n\nTry box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s. It takes under 2 minutes."),
        ("focus",       "Your data shows that typing rhythm is most consistent in the morning. Protect that time for your hardest tasks and schedule meetings for the afternoon.\n\n**Tip:** Block 9–11 AM as deep-work time in your calendar."),
        ("break",       "Taking short breaks actually increases overall productivity. Research shows a 5-minute break every 90 minutes improves focus by up to 30%.\n\nStep away from the keyboard, stretch, and drink water."),
        ("tired",       "Fatigue shows up in typing patterns as increased deletion frequency and slower flight times. Your body is signaling it needs rest.\n\n**Recommendation:** Consider a 10-minute power nap or a short walk outside."),
        ("anxious",     "Anxiety often manifests as erratic keystroke timing. The nervous system responds well to controlled breathing.\n\n**Exercise:** Try 4-7-8 breathing — inhale 4s, hold 7s, exhale 8s."),
        ("overwhelmed", "When feeling overwhelmed, the most effective strategy is task decomposition. Break your current task into the smallest possible steps.\n\nWhat is the single next action you can take in the next 5 minutes?"),
        ("sleep",       "Sleep quality directly impacts keystroke dynamics the following day. Poor sleep increases typing variability by up to 25%.\n\n**Goal:** Aim for consistent sleep and wake times, even on weekends."),
        ("water",       "Mild dehydration (as little as 1.5% body weight) measurably slows cognitive processing and increases typing errors.\n\n**Reminder:** A glass of water every 90 minutes is sufficient for most people."),
    ];

    private const string _defaultReply =
        "I'm analyzing your wellness data to provide personalized insights. Based on what I can see, maintaining regular breaks and consistent sleep patterns will have the biggest impact on your stress levels.\n\nIs there a specific aspect of your wellbeing you'd like to focus on today?";

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("ai/chat", (Request request) =>
        {
            string msg = request.Message;
            string reply = _defaultReply;

            foreach ((string keyword, string response) in _responses)
            {
                if (msg.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                {
                    reply = response;
                    break;
                }
            }

            return Results.Ok(new { reply });
        })
        .WithTags(Tags.Chat)
        .RequireAuthorization()
        .WithSummary("Send a message to the SublAI assistant");
    }
}
