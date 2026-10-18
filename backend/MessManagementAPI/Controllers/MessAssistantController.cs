using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace MessManagementAPI.Controllers
{
    public class AssistantQuestionDto
    {
        public string Message { get; set; } = "";
        public List<AssistantMessageDto> History { get; set; } = [];
    }

    public class AssistantMessageDto
    {
        public string Role { get; set; } = "user";
        public string Text { get; set; } = "";
    }

    [ApiController]
    [Route("api/mess-assistant")]
    public class MessAssistantController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public MessAssistantController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpPost("ask")]
        public async Task<IActionResult> Ask([FromBody] AssistantQuestionDto question)
        {
            var text = (question?.Message ?? "").Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(text))
                return BadRequest(new { message = "Please enter a question." });

            var apiKey = _configuration["OPENAI_API_KEY"] ?? _configuration["OpenAI:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
                return Ok(new { answer = GetAnswer(text), source = "MessHub guide", aiEnabled = false });

            try
            {
                var conversation = question.History
                    .TakeLast(8)
                    .Where(m => !string.IsNullOrWhiteSpace(m.Text))
                    .Select(m => new { role = m.Role == "assistant" ? "assistant" : "user", content = m.Text.Trim() })
                    .Cast<object>()
                    .ToList();
                conversation.Add(new { role = "user", content = question.Message.Trim() });

                var body = new
                {
                    model = _configuration["OpenAI:Model"] ?? "gpt-4.1-mini",
                    instructions = "You are the friendly MessHub AI assistant for college students. Explain only MessHub features: daily menu, attendance, leave applications, payments/invoices, feedback, notifications, and food requests. Give clear, short, step-by-step help in plain English. If a question is unrelated, politely say you can help with MessHub. Never invent account data, payment status, menu items, rules, or admin contact details.",
                    input = conversation,
                    max_output_tokens = 300
                };

                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                using var response = await client.PostAsync("https://api.openai.com/v1/responses", new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"));
                var responseText = await response.Content.ReadAsStringAsync();
                if (!response.IsSuccessStatusCode)
                    return StatusCode((int)response.StatusCode, new { message = "The AI service could not answer right now." });

                var answer = JsonNode.Parse(responseText)?["output_text"]?.GetValue<string>();
                if (string.IsNullOrWhiteSpace(answer))
                    return StatusCode(502, new { message = "The AI service returned an empty response." });

                return Ok(new { answer, source = "AI", aiEnabled = true });
            }
            catch (HttpRequestException)
            {
                return StatusCode(503, new { message = "The AI service is unavailable. Please try again shortly." });
            }
        }

        private static string GetAnswer(string text)
        {
            if (Contains(text, "menu", "food", "breakfast", "lunch", "dinner"))
                return "Open Menu from the navigation bar to see today's breakfast, lunch, and dinner. The menu is updated by the mess staff/admin.";
            if (Contains(text, "attendance", "present", "absent"))
                return "Open Attendance to view your recorded status. If you believe it is incorrect, contact the mess staff or admin so they can update the record.";
            if (Contains(text, "leave", "holiday", "going home"))
                return "Use Leave in the navigation bar to apply for leave. Select the dates and reason, then submit. Your meal planning is adjusted after the leave is approved.";
            if (Contains(text, "payment", "fee", "invoice", "pay"))
                return "Open Pay Fees to view your invoice and payment details. Contact the admin if a payment is missing or incorrect.";
            if (Contains(text, "feedback", "complaint", "rating", "suggest"))
                return "Open Feedback to rate the mess service and send suggestions or complaints. You can submit it anonymously if you prefer.";
            if (Contains(text, "contact", "help", "admin", "staff"))
                return "For account, attendance, payment, or menu issues, please contact your mess admin or staff member. You can also send feedback from the Feedback page.";
            if (Contains(text, "hello", "hi", "hey"))
                return "Hello! I can help you understand the Menu, Attendance, Leave, Pay Fees, and Feedback features. What would you like to know?";

            return "I can help with Menu, Attendance, Leave, Pay Fees, and Feedback. Try asking: 'How do I apply for leave?' or 'Where can I see today's menu?'";
        }

        private static bool Contains(string text, params string[] words) => words.Any(text.Contains);
    }
}
