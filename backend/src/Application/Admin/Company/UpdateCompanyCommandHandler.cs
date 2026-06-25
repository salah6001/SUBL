using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.Accounts;
using Domain.Alerts;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Admin.Company;

internal sealed class UpdateCompanyCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : ICommandHandler<UpdateCompanyCommand, CompanyResponse>
{
    public async Task<Result<CompanyResponse>> Handle(UpdateCompanyCommand request, CancellationToken cancellationToken)
    {
        // Only a super admin may rename the company.
        if (!currentUserService.IsSuperAdmin)
        {
            return Result.Failure<CompanyResponse>(AlertErrors.Forbidden);
        }

        string name = request.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name))
        {
            return Result.Failure<CompanyResponse>(Error.Validation(
                "Company.NameRequired", "Company name cannot be empty."));
        }

        Account? account = await context.Accounts
            .OrderBy(a => a.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (account is null)
        {
            return Result.Failure<CompanyResponse>(Error.NotFound(
                "Company.NotFound", "No company has been configured yet."));
        }

        account.Rename(name);
        await context.SaveChangesAsync(cancellationToken);

        return new CompanyResponse(account.Id, account.Name);
    }
}
