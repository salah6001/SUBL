using System.Text;
using Application.Abstractions.Messaging;
using Application.Privacy.ExportStressHistory;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Users;

internal sealed class ExportMyData : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("users/me/data/export", async (
            IQueryHandler<ExportStressHistoryQuery, string> handler,
            CancellationToken cancellationToken) =>
        {
            Result<string> result = await handler.Handle(
                new ExportStressHistoryQuery(),
                cancellationToken);

            return result.Match(
                csv => Results.File(
                    Encoding.UTF8.GetBytes(csv),
                    "text/csv",
                    "subl-stress-history.csv"),
                CustomResults.Problem);
        })
        .RequireAuthorization()
        .WithTags(Tags.Users)
        .WithSummary("Export the current user's full stress reading history as CSV");
    }
}
