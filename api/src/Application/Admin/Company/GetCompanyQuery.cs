using Application.Abstractions.Messaging;

namespace Application.Admin.Company;

/// <summary>Returns the organisation's company record (the primary account).</summary>
public sealed record GetCompanyQuery : IQuery<CompanyResponse>;
