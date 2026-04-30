using Microsoft.AspNetCore.Mvc;
using MessManagementAPI.Data;
using MessManagementAPI.Models;
using System.Globalization;

namespace MessManagementAPI.Controllers
{
    public class PaymentDto
    {
        public int     StudentId   { get; set; }
        public string  StudentName { get; set; } = "";
        public string  Plan        { get; set; } = "";
        public decimal Amount      { get; set; }
        public string  Method      { get; set; } = "";
        public string  Status      { get; set; } = "Paid";
        public string  PaidAt      { get; set; } = "";
        public string  ReceiptId   { get; set; } = "";
    }

    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentController(AppDbContext context)
        {
            _context = context;
        }

        private static DateTime GetPaymentDate(string? paidAt)
        {
            if (DateTimeOffset.TryParse(
                    paidAt,
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.AssumeUniversal,
                    out var parsedOffset))
            {
                return parsedOffset.LocalDateTime;
            }

            if (DateTime.TryParse(
                    paidAt,
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.AssumeLocal,
                    out var parsedDate))
            {
                return parsedDate;
            }

            return DateTime.Now;
        }

        private static bool IsSameMonth(string paidAt, DateTime paymentDate)
        {
            var existingDate = GetPaymentDate(paidAt);
            return existingDate.Year == paymentDate.Year
                && existingDate.Month == paymentDate.Month;
        }

        // GET /api/payment — admin sees all payments
        [HttpGet]
        public IActionResult GetAll([FromQuery] int? studentId = null)
        {
            var query = _context.Payments.AsQueryable();

            if (studentId.HasValue)
                query = query.Where(p => p.StudentId == studentId.Value);

            var result = query
                .OrderByDescending(p => p.PaidAt)
                .Select(p => new
                {
                    id          = p.Id,
                    studentId   = p.StudentId,
                    studentName = p.StudentName,
                    plan        = p.Plan,
                    amount      = p.Amount,
                    method      = p.Method,
                    status      = p.Status,
                    paidAt      = p.PaidAt,
                    receiptId   = p.ReceiptId,
                })
                .ToList();

            return Ok(result);
        }

        // GET /api/payment/student/{studentId} — student sees own payments
        [HttpGet("student/{studentId}")]
        public IActionResult GetByStudent(int studentId)
        {
            var result = _context.Payments
                .Where(p => p.StudentId == studentId)
                .OrderByDescending(p => p.PaidAt)
                .Select(p => new
                {
                    id          = p.Id,
                    studentId   = p.StudentId,
                    studentName = p.StudentName,
                    plan        = p.Plan,
                    amount      = p.Amount,
                    method      = p.Method,
                    status      = p.Status,
                    paidAt      = p.PaidAt,
                    receiptId   = p.ReceiptId,
                })
                .ToList();

            return Ok(result);
        }

        // POST /api/payment — student submits a payment
        [HttpPost]
        public IActionResult CreatePayment([FromBody] PaymentDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Request body is empty." });

            if (string.IsNullOrWhiteSpace(dto.Plan))
                return BadRequest(new { message = "Plan is required." });

            var paymentDate = GetPaymentDate(dto.PaidAt);
            var alreadyPaidForMonth = _context.Payments
                .Where(p => p.StudentId == dto.StudentId && p.Status == "Paid")
                .AsEnumerable()
                .Any(p => IsSameMonth(p.PaidAt, paymentDate));

            if (alreadyPaidForMonth)
            {
                return Conflict(new
                {
                    message = $"Fees for {paymentDate:MMMM yyyy} have already been paid."
                });
            }

            var payment = new Payment
            {
                StudentId   = dto.StudentId,
                StudentName = dto.StudentName,
                Plan        = dto.Plan,
                Amount      = dto.Amount,
                Method      = dto.Method,
                Status      = "Paid",
                PaidAt      = string.IsNullOrWhiteSpace(dto.PaidAt) ? paymentDate.ToString("o") : dto.PaidAt,
                ReceiptId   = dto.ReceiptId ?? "RCP" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            };

            _context.Payments.Add(payment);

            _context.Notifications.Add(new Notification
            {
                UserId    = 0,
                Title     = "Fees Payment Received",
                Message   = $"{payment.StudentName} paid Rs. {payment.Amount.ToString("N0", CultureInfo.GetCultureInfo("en-IN"))} for {payment.Plan}. Receipt: {payment.ReceiptId}.",
                Type      = "success",
                IsRead    = false,
                CreatedAt = DateTime.Now.ToString("o"),
                Role      = "admin",
            });

            _context.SaveChanges();

            return Ok(new
            {
                message     = "Payment recorded successfully.",
                id          = payment.Id,
                receiptId   = payment.ReceiptId,
                studentId   = payment.StudentId,
                plan        = payment.Plan,
                amount      = payment.Amount,
                method      = payment.Method,
                status      = payment.Status,
                paidAt      = payment.PaidAt,
            });
        }
    }
}
