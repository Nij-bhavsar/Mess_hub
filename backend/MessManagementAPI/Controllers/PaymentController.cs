using Microsoft.AspNetCore.Mvc;
using MessManagementAPI.Data;
using MessManagementAPI.Models;

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

            var payment = new Payment
            {
                StudentId   = dto.StudentId,
                StudentName = dto.StudentName,
                Plan        = dto.Plan,
                Amount      = dto.Amount,
                Method      = dto.Method,
                Status      = "Paid",
                PaidAt      = dto.PaidAt ?? DateTime.Now.ToString("o"),
                ReceiptId   = dto.ReceiptId ?? "RCP" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            };

            _context.Payments.Add(payment);
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