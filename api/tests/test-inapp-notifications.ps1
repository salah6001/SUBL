# Test In-App Notifications via SignalR
# Requires: dotnet tool install -g Microsoft.AspNetCore.SignalR.Client.Tool (or similar client, but we'll use raw websockets/http for simplicity or a .NET client script)
# Actually, testing SignalR from PowerShell is tricky without the client library.
# We will use a simple C# console app approach embedded in the script or just use the API to verify the side effects (unread count increment).
# For true real-time verification, we need a client. Let's create a small C# console app for testing.

$ProjectRoot = "$PSScriptRoot/.."
$TestClientPath = "$ProjectRoot/tests/SignalRTestClient"

Write-Host "Creating SignalR Test Client..." -ForegroundColor Cyan

if (-not (Test-Path $TestClientPath)) {
    New-Item -ItemType Directory -Force -Path $TestClientPath | Out-Null
    dotnet new console -o $TestClientPath --force
    dotnet add $TestClientPath package Microsoft.AspNetCore.SignalR.Client
}

$ProgramCs = @"
using Microsoft.AspNetCore.SignalR.Client;
using System.Net.Http.Json;
using System.Net.Http.Headers;

namespace SignalRTestClient;

class Program
{
    static async Task Main(string[] args)
    {
        string baseUrl = ""http://localhost:5000""; // Adjust if needed
        string email = ""admin@example.com"";
        string password = ""Admin123!"";

        Console.WriteLine(""1. Authenticating..."");
        using var httpClient = new HttpClient();
        var loginResponse = await httpClient.PostAsJsonAsync($""{baseUrl}/users/login"", new { email, password });
        
        if (!loginResponse.IsSuccessStatusCode)
        {
            Console.WriteLine($""Login failed: {loginResponse.StatusCode}"");
            return;
        }

        var loginResult = await loginResponse.Content.ReadFromJsonAsync<LoginResult>();
        string token = loginResult.AccessToken;
        Console.WriteLine(""   Authenticated successfully."");

        Console.WriteLine(""2. Connecting to SignalR Hub..."");
        var connection = new HubConnectionBuilder()
            .WithUrl($""{baseUrl}/notifications/hub"", options =>
            {
                options.AccessTokenProvider = () => Task.FromResult(token);
            })
            .WithAutomaticReconnect()
            .Build();

        var tcs = new TaskCompletionSource<string>();

        connection.On<object>(""ReceiveNotification"", (message) =>
        {
            Console.WriteLine($""   [EVENT] Received Notification: {message}"");
            tcs.TrySetResult(""Success"");
        });

        connection.On<int>(""UnreadCountUpdated"", (count) =>
        {
            Console.WriteLine($""   [EVENT] Unread Count Updated: {count}"");
        });

        await connection.StartAsync();
        Console.WriteLine($""   Connected. Connection ID: {connection.ConnectionId}"");

        Console.WriteLine(""3. Triggering Test Notification..."");
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(""Bearer"", token);
        var triggerResponse = await httpClient.PostAsync($""{baseUrl}/notifications/test"", null);

        if (!triggerResponse.IsSuccessStatusCode)
        {
            Console.WriteLine($""Trigger failed: {triggerResponse.StatusCode}"");
        }
        else 
        {
            Console.WriteLine(""   Notification triggered."");
        }

        Console.WriteLine(""4. Waiting for notification..."");
        
        var completedTask = await Task.WhenAny(tcs.Task, Task.Delay(5000));

        if (completedTask == tcs.Task)
        {
            Console.WriteLine(""   SUCCESS: Notification received!"");
        }
        else
        {
            Console.WriteLine(""   TIMEOUT: Notification not received within 5 seconds."");
        }

        await connection.StopAsync();
    }

    record LoginResult(string AccessToken);
}
"@

$ProgramCs | Out-File "$TestClientPath/Program.cs" -Encoding UTF8

Write-Host "Building and Running Test Client..." -ForegroundColor Cyan
dotnet run --project $TestClientPath
