using MessManagementAPI.Data;
using MessManagementAPI.Models;

namespace MessManagementAPI.Services
{
    public class MonthlyFeeService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public MonthlyFeeService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public object GetInvoice(int studentId, string? month)
        {
            var invoiceMonth = ParseMonth(month);
            var start = new DateOnly(invoiceMonth.Year, invoiceMonth.Month, 1);
            var end = start.AddMonths(1).AddDays(-1);
            var rate = _configuration.GetValue<decimal?>("MonthlyFee:DailyRate") ?? 120m;
            var presentDates = _context.Attendances.AsEnumerable()
                .Where(a => a.StudentId == studentId && a.Status == "Present" && DateOnly.TryParse(a.Date, out var d) && d >= start && d <= end)
                .Select(a => a.Date)
                .Distinct()
                .OrderBy(d => d)
                .ToList();
            var subtotal = presentDates.Count * rate;
            var gst = Math.Round(subtotal * .05m, 2);
            var label = invoiceMonth.ToString("MMMM yyyy");
            var isPaid = _context.Payments.Any(p => p.StudentId == studentId && p.Status == "Paid" && p.Plan.Contains(label));

            return new { studentId, month = invoiceMonth.ToString("yyyy-MM"), monthLabel = label, dailyRate = rate, foodDays = presentDates.Count, attendanceDates = presentDates, subtotal, gst, total = subtotal + gst, status = isPaid ? "Paid" : "Due" };
        }

        public int SendMonthEndNotifications(string? month)
        {
            var invoiceMonth = ParseMonth(month);
            var label = invoiceMonth.ToString("MMMM yyyy");
            var title = $"Month-end mess fee - {label}";
            var students = _context.Users.Where(u => u.Role.ToLower() == "student").ToList();
            var sent = 0;
            foreach (var student in students)
            {
                if (_context.Notifications.Any(n => n.UserId == student.Id && n.Title == title)) continue;
                dynamic invoice = GetInvoice(student.Id, invoiceMonth.ToString("yyyy-MM"));
                _context.Notifications.Add(new Notification { UserId = student.Id, Role = "student", Title = title, Message = $"Your mess fee is ready: {invoice.foodDays} food days × Rs. {invoice.dailyRate} + GST = Rs. {invoice.total:N2}. Please pay from Pay Fees.", Type = "info", IsRead = false, CreatedAt = DateTime.Now.ToString("o") });
                sent++;
            }
            if (sent > 0) _context.SaveChanges();
            return sent;
        }

        private static DateOnly ParseMonth(string? month)
        {
            if (!string.IsNullOrWhiteSpace(month) && DateOnly.TryParseExact(month + "-01", "yyyy-MM-dd", out var parsed)) return parsed;
            var today = DateOnly.FromDateTime(DateTime.Today);
            return new DateOnly(today.Year, today.Month, 1);
        }
    }

    public class MonthEndBillingWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        public MonthEndBillingWorker(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var today = DateOnly.FromDateTime(DateTime.Today);
                if (today.Day == DateTime.DaysInMonth(today.Year, today.Month))
                {
                    using var scope = _scopeFactory.CreateScope();
                    scope.ServiceProvider.GetRequiredService<MonthlyFeeService>().SendMonthEndNotifications(today.ToString("yyyy-MM"));
                }
                await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
            }
        }
    }
}
