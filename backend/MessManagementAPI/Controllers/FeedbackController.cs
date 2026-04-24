using Microsoft.AspNetCore.Mvc;
using MessManagementAPI.Data;
using MessManagementAPI.Models;

namespace MessManagementAPI.Controllers
{
    public class FeedbackSubmitDto
    {
        public int?   StudentId   { get; set; }
        public string StudentName { get; set; } = "";
        public string Category    { get; set; } = "";
        public int    Rating      { get; set; }
        public string Message     { get; set; } = "";
        public bool   Anonymous   { get; set; } = false;
    }

    public class FeedbackReplyDto
    {
        public string Status     { get; set; } = "Reviewed";
        public string AdminReply { get; set; } = "";
    }

    [ApiController]
    [Route("api/[controller]")]
    public class FeedbackController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FeedbackController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/feedback — admin sees all
        [HttpGet]
        public IActionResult GetAll(
            [FromQuery] string? status   = null,
            [FromQuery] string? category = null)
        {
            var query = _context.Feedbacks.AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(f => f.Status == status);
            if (!string.IsNullOrWhiteSpace(category))
                query = query.Where(f => f.Category == category);

            var result = query
                .OrderByDescending(f => f.SubmittedAt)
                .Select(f => new {
                    id          = f.Id,
                    studentId   = f.StudentId,
                    studentName = f.Anonymous ? "Anonymous" : f.StudentName,
                    category    = f.Category,
                    rating      = f.Rating,
                    message     = f.Message,
                    anonymous   = f.Anonymous,
                    status      = f.Status,
                    adminReply  = f.AdminReply,
                    submittedAt = f.SubmittedAt,
                    reviewedAt  = f.ReviewedAt,
                }).ToList();

            return Ok(result);
        }

        // GET /api/feedback/student/{studentId} — student sees own feedbacks
        [HttpGet("student/{studentId}")]
        public IActionResult GetByStudent(int studentId)
        {
            var result = _context.Feedbacks
                .Where(f => f.StudentId == studentId)
                .OrderByDescending(f => f.SubmittedAt)
                .Select(f => new {
                    id          = f.Id,
                    category    = f.Category,
                    rating      = f.Rating,
                    message     = f.Message,
                    status      = f.Status,
                    adminReply  = f.AdminReply,
                    submittedAt = f.SubmittedAt,
                    reviewedAt  = f.ReviewedAt,
                }).ToList();

            return Ok(result);
        }

        // POST /api/feedback — student submits
        [HttpPost]
        public IActionResult Submit([FromBody] FeedbackSubmitDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Request body is empty." });

            if (string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest(new { message = "Feedback message is required." });

            if (dto.Rating < 1 || dto.Rating > 5)
                return BadRequest(new { message = "Rating must be between 1 and 5." });

            var feedback = new FeedbackEntry
            {
                StudentId   = dto.Anonymous ? null : dto.StudentId,
                StudentName = dto.Anonymous ? "Anonymous" : dto.StudentName,
                Category    = dto.Category,
                Rating      = dto.Rating,
                Message     = dto.Message,
                Anonymous   = dto.Anonymous,
                Status      = "Pending",
                AdminReply  = "",
                SubmittedAt = DateTime.Now.ToString("o"),
            };

            _context.Feedbacks.Add(feedback);

            // Notify admin about new feedback
            _context.Notifications.Add(new Notification
            {
                UserId    = 0,
                Title     = "New Feedback Received",
                Message   = $"{(dto.Anonymous ? "Anonymous" : dto.StudentName)} submitted {dto.Rating}-star feedback for {dto.Category}.",
                Type      = "info",
                IsRead    = false,
                CreatedAt = DateTime.Now.ToString("o"),
                Role      = "admin",
            });

            _context.SaveChanges();

            return Ok(new { message = "Feedback submitted successfully.", id = feedback.Id });
        }

        // PUT /api/feedback/{id}/reply — admin replies
        [HttpPut("{id}/reply")]
        public IActionResult Reply(int id, [FromBody] FeedbackReplyDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Request body is empty." });

            var feedback = _context.Feedbacks.FirstOrDefault(f => f.Id == id);
            if (feedback == null)
                return NotFound(new { message = "Feedback not found." });

            feedback.Status      = dto.Status ?? "Reviewed";
            feedback.AdminReply  = dto.AdminReply ?? "";
            feedback.ReviewedAt  = DateTime.Now.ToString("o");

            // Notify student if not anonymous
            if (feedback.StudentId.HasValue && !feedback.Anonymous)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId    = feedback.StudentId.Value,
                    Title     = "Admin replied to your feedback",
                    Message   = string.IsNullOrWhiteSpace(dto.AdminReply)
                        ? $"Your feedback about {feedback.Category} has been marked as {feedback.Status}."
                        : $"Admin replied to your {feedback.Category} feedback: \"{dto.AdminReply}\"",
                    Type      = "success",
                    IsRead    = false,
                    CreatedAt = DateTime.Now.ToString("o"),
                    Role      = "student",
                });
            }

            _context.SaveChanges();

            return Ok(new { message = "Reply sent.", status = feedback.Status });
        }

        // DELETE /api/feedback/{id}
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var feedback = _context.Feedbacks.FirstOrDefault(f => f.Id == id);
            if (feedback == null) return NotFound();
            _context.Feedbacks.Remove(feedback);
            _context.SaveChanges();
            return Ok(new { message = "Deleted." });
        }
    }
}