using Application.Abstractions.Messaging;
using Application.Admin.Company;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Admin;

internal sealed class Company : IEndpoint
{
    public sealed record UpdateRequest(string Name);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        // Any authenticated user can read the company name (shown as a banner in
        // both dashboards).
        app.MapGet("admin/company", async (
            IQueryHandler<GetCompanyQuery, CompanyResponse> handler,
            CancellationToken cancellationToken) =>
        {
            Result<CompanyResponse> result = await handler.Handle(new GetCompanyQuery(), cancellationToken);
            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Admin)
        .RequireAuthorization()
        .WithSummary("Get the organisation's company name");

        // Only a super admin may rename the company.
        app.MapPut("admin/company", async (
            UpdateRequest request,
            ICommandHandler<UpdateCompanyCommand, CompanyResponse> handler,
            CancellationToken cancellationToken) =>
        {
            Result<CompanyResponse> result = await handler.Handle(new UpdateCompanyCommand(request.Name), cancellationToken);
            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Admin)
        .RequireAuthorization()
        .WithSummary("Rename the organisation's company (super admin)");
    }
}
