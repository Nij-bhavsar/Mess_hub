using Microsoft.AspNetCore.Mvc;
using MessManagementAPI.Data;

namespace MessManagementAPI.Controllers
{
    /// <summary>
    /// A transparent recommendation model. It learns from attendance, leave and
    /// student food requests already stored by the application.
    /// </summary>
    [ApiController]
    [Route("api/food-prediction")]
    public class FoodPredictionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private sealed record FoodSuggestion(string Item, string Reason);

        public FoodPredictionController(AppDbContext context) => _context = context;

        [HttpGet]
        public IActionResult GetPrediction([FromQuery] string? date = null)
        {
            var targetDate = DateOnly.TryParse(date, out var parsed) ? parsed : DateOnly.FromDateTime(DateTime.Today.AddDays(1));
            var targetKey = targetDate.ToString("yyyy-MM-dd");
            // Student accounts live in Users (the Student table is legacy in this app).
            var studentCount = _context.Users.Count(u => u.Role.ToLower() == "student");

            var approvedLeaves = _context.Leaves
                .Where(l => l.Status == "Approved" && l.UserRole.ToLower() == "student")
                .ToList()
                .Count(l => DateOnly.TryParse(l.FromDate, out var from) && DateOnly.TryParse(l.ToDate, out var to) && targetDate >= from && targetDate <= to);

            var matchingDayCounts = _context.Attendances
                .AsEnumerable()
                .Where(a => a.Status == "Present" && DateOnly.TryParse(a.Date, out var d) && d.DayOfWeek == targetDate.DayOfWeek && d < targetDate)
                .GroupBy(a => a.Date)
                .OrderByDescending(g => g.Key)
                .Take(4)
                .Select(g => g.Select(a => a.StudentId).Distinct().Count())
                .ToList();

            var availableStudents = Math.Max(0, studentCount - approvedLeaves);
            var historicalAverage = matchingDayCounts.Count == 0 ? availableStudents : matchingDayCounts.Average();
            // Blend recent same-weekday attendance with the confirmed leave-adjusted roster.
            var expectedDiners = (int)Math.Ceiling(Math.Max(0, (historicalAverage * 0.7) + (availableStudents * 0.3)));
            var plannedServings = (int)Math.Ceiling(expectedDiners * 1.05);

            var requestedFoods = _context.ItemRequests
                .Where(r => r.Category == "Food Item" || r.Category == "Ingredient")
                .AsEnumerable()
                .GroupBy(r => r.ItemName.Trim(), StringComparer.OrdinalIgnoreCase)
                .Select(g => new { name = g.First().ItemName.Trim(), score = g.Sum(r => r.Status == "Approved" ? 3 : r.Status == "Pending" ? 1 : 0) })
                .Where(x => !string.IsNullOrWhiteSpace(x.name) && x.score > 0)
                .OrderByDescending(x => x.score)
                .ThenBy(x => x.name)
                .Take(3)
                .ToList();

            var menuDishes = _context.Menus
                .AsEnumerable()
                .SelectMany(m => new[] { m.Breakfast, m.Lunch, m.Dinner })
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x!.Trim())
                .GroupBy(x => x, StringComparer.OrdinalIgnoreCase)
                .OrderByDescending(g => g.Count())
                .Select(g => g.First())
                .ToList();

            var suggestions = requestedFoods.Select(x => new FoodSuggestion(x.name, $"Requested by students (interest score {x.score})")).ToList();
            foreach (var dish in menuDishes)
            {
                if (suggestions.Count >= 5 || suggestions.Any(s => s.Item.Equals(dish, StringComparison.OrdinalIgnoreCase))) continue;
                suggestions.Add(new FoodSuggestion(dish, "Frequently included in previous menus"));
            }
            if (suggestions.Count == 0)
            {
                suggestions.Add(new FoodSuggestion("Seasonal vegetable curry", "Starter option until student requests and menu history are available"));
                suggestions.Add(new FoodSuggestion("Dal with rice/roti", "Balanced staple meal"));
            }

            return Ok(new
            {
                date = targetKey,
                expectedStudents = expectedDiners,
                plannedServings,
                confidence = matchingDayCounts.Count >= 3 ? "High" : matchingDayCounts.Count > 0 ? "Medium" : "Starter",
                inputs = new { totalStudents = studentCount, approvedLeaves, historicalSameWeekdayDays = matchingDayCounts.Count },
                quantityGuide = new[]
                {
                    new { ingredient = "Rice", quantityKg = Math.Round(plannedServings * 0.18m, 1), perStudent = "180 g" },
                    new { ingredient = "Wheat flour / roti", quantityKg = Math.Round(plannedServings * 0.12m, 1), perStudent = "120 g" },
                    new { ingredient = "Dal / pulses", quantityKg = Math.Round(plannedServings * 0.06m, 1), perStudent = "60 g" },
                    new { ingredient = "Vegetables", quantityKg = Math.Round(plannedServings * 0.20m, 1), perStudent = "200 g" }
                },
                suggestions
            });
        }
    }
}
