using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Accounts;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Admin.Company;

internal sealed class GetCompanyQueryHandler(IApplicationDbContext context)
    : IQueryHandler<GetCompanyQuery, CompanyResponse>
{
    public async Task<Result<CompanyResponse>> Handle(GetCompanyQuery request, CancellationToken cancellationToken)
    {
        // The product is single-company: the earliest-created account is treated
        // as "the company" whose name is shown across both dashboards.
        Account? account = await context.Accounts
            .AsNoTracking()
            .OrderBy(a => a.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (account is null)
        {
            return Result.Failure<CompanyResponse>(Error.NotFound(
                "Company.NotFound", "No company has been configured yet."));
        }

        return new CompanyResponse(account.Id, account.Name);
    }
}
