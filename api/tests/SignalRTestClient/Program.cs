using Microsoft.AspNetCore.SignalR.Client;
using System.Net.Http.Json;
using System.Net.Http.Headers;

namespace SignalRTestClient;

class Program
{
    static async Task Main(string[] args)
    {
        string baseUrl = "http://localhost:5000"; // Adjust if needed
        string email = "admin@onex.com";
        string password = "Admin@123!";

        Console.WriteLine("1. Authenticating...");
        using var httpClient = new HttpClient();
        
        try 
        {
            var loginResponse = await httpClient.PostAsJsonAsync($"{baseUrl}/users/login", new { email, password });
            
            if (!loginResponse.IsSuccessStatusCode)
            {
                Console.WriteLine($"Login failed: {loginResponse.StatusCode}");
                string error = await loginResponse.Content.ReadAsStringAsync();
                Console.WriteLine($"Error: {error}");
                return;
            }

            var loginResult = await loginResponse.Content.ReadFromJsonAsync<LoginResult>();
            string token = loginResult?.AccessToken ?? "";
            
            if (string.IsNullOrEmpty(token))
            {
                 Console.WriteLine("Login succeeded but token is empty.");
                 return;
            }
            
            Console.WriteLine("   Authenticated successfully.");

            Console.WriteLine("2. Connecting to SignalR Hub...");
            var connection = new HubConnectionBuilder()
                .WithUrl($"{baseUrl}/hubs/notifications", options =>
                {
                    options.AccessTokenProvider = () => Task.FromResult<string?>(token);
                })
                .WithAutomaticReconnect()
                .Build();

            var tcs = new TaskCompletionSource<string>();

            connection.On<object>("ReceiveNotification", (message) =>
            {
                Console.WriteLine($"   [EVENT] Received Notification: {message}");
                tcs.TrySetResult("Success");
            });

            connection.On<int>("UnreadCountUpdated", (count) =>
            {
                Console.WriteLine($"   [EVENT] Unread Count Updated: {count}");
            });

            await connection.StartAsync();
            Console.WriteLine($"   Connected. Connection ID: {connection.ConnectionId}");

            Console.WriteLine("3. Triggering Test Notification...");
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var triggerResponse = await httpClient.PostAsync($"{baseUrl}/api/notifications/test", null);

            if (!triggerResponse.IsSuccessStatusCode)
            {
                Console.WriteLine($"Trigger failed: {triggerResponse.StatusCode}");
                string error = await triggerResponse.Content.ReadAsStringAsync();
                Console.WriteLine($"Error: {error}");
            }
            else 
            {
                Console.WriteLine("   Notification triggered.");
            }

            Console.WriteLine("4. Waiting for notification...");
            
            var completedTask = await Task.WhenAny(tcs.Task, Task.Delay(5000));

            if (completedTask == tcs.Task)
            {
                Console.WriteLine("   SUCCESS: Notification received!");
            }
            else
            {
                Console.WriteLine("   TIMEOUT: Notification not received within 5 seconds.");
            }

            await connection.StopAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"EXCEPTION: {ex.Message}");
        }
    }

    record LoginResult(string AccessToken);
}
