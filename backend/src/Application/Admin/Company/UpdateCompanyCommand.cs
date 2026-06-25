using Application.Abstractions.Messaging;

namespace Application.Admin.Company;

/// <summary>Renames the organisation's company (super admin only).</summary>
public sealed record UpdateCompanyCommand(string Name) : ICommand<CompanyResponse>;
