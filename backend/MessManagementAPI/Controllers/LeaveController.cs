using Microsoft.AspNetCore.Mvc;
using MessManagementAPI.Data;
using MessManagementAPI.Models;

namespace MessManagementAPI.Controllers
{
    public class LeaveApplyDto
    {
        public int    UserId    { get; set; }
        public string UserName  { get; set; } = "";
        public string UserRole  { get; set; } = "";
        public string FromDate  { get; set; } = "";
        public string ToDate    { get; set; } = "";
        public string Reason    { get; set; } = "";
        public string LeaveType { get; set; } = "";
    }

    public class LeaveActionDto
    {
        public string Status      { get; set; } = ""; // Approved or Rejected
        public string AdminRemark { get; set; } = "";
    }

    [ApiController]
    [Route("api/[controller]")]
    public class LeaveController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LeaveController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/leave — admin sees all, user sees own
        [HttpGet]
        public IActionResult GetLeaves(
            [FromQuery] int?    userId = null,
            [FromQuery] string? status = null,
            [FromQuery] string? role   = null)
        {
            var query = _context.Leaves.AsQueryable();

            if (userId.HasValue)
                query = query.Where(l => l.UserId == userId.Value);
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(l => l.Status == status);
            if (!string.IsNullOrWhiteSpace(role))
                query = query.Where(l => l.UserRole.ToLower() == role.ToLower());

            var result = query
                .OrderByDescending(l => l.AppliedAt)
                .Select(l => new {
                    id          = l.Id,
                    userId      = l.UserId,
                    userName    = l.UserName,
                    userRole    = l.UserRole,
                    fromDate    = l.FromDate,
                    toDate      = l.ToDate,
                    reason      = l.Reason,
                    leaveType   = l.LeaveType,
                    status      = l.Status,
                    adminRemark = l.AdminRemark,
                    appliedAt   = l.AppliedAt,
                    updatedAt   = l.UpdatedAt,
                }).ToList();

            return Ok(result);
        }

        // POST /api/leave — student or staff applies for leave
        [HttpPost]
        public IActionResult ApplyLeave([FromBody] LeaveApplyDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Request body is empty." });

            if (string.IsNullOrWhiteSpace(dto.FromDate) || string.IsNullOrWhiteSpace(dto.ToDate))
                return BadRequest(new { message = "From date and To date are required." });

            if (string.IsNullOrWhiteSpace(dto.Reason))
                return BadRequest(new { message = "Reason is required." });

            var leave = new Leave
            {
                UserId      = dto.UserId,
                UserName    = dto.UserName,
                UserRole    = dto.UserRole,
                FromDate    = dto.FromDate,
                ToDate      = dto.ToDate,
                Reason      = dto.Reason,
                LeaveType   = dto.LeaveType ?? "Personal",
                Status      = "Pending",
                AdminRemark = "",
                AppliedAt   = DateTime.Now.ToString("o"),
                UpdatedAt   = DateTime.Now.ToString("o"),
            };

            using var transaction = _context.Database.BeginTransaction();
            _context.Leaves.Add(leave);
            _context.SaveChanges();

            // Target each admin account directly so the notification query and
            // per-user read state cannot hide a role broadcast from an admin.
            var admins = _context.Users
                .Where(user => user.Role.ToLower() == "admin")
                .Select(user => user.Id)
                .ToList();
            var notificationMessage = $"{leave.UserName} ({leave.UserRole}) applied for {leave.LeaveType} from {leave.FromDate} to {leave.ToDate}. Reason: {leave.Reason}";
            var createdAt = DateTime.Now.ToString("o");

            if (admins.Count == 0)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = 0,
                    Title = "New Leave Request",
                    Message = notificationMessage,
                    Type = "info",
                    IsRead = false,
                    CreatedAt = createdAt,
                    Role = "admin",
                });
            }
            else
            {
                _context.Notifications.AddRange(admins.Select(adminId => new Notification
                {
                    UserId = adminId,
                    Title = "New Leave Request",
                    Message = notificationMessage,
                    Type = "info",
                    IsRead = false,
                    CreatedAt = createdAt,
                    Role = "admin",
                }));
            }

            _context.SaveChanges();
            transaction.Commit();

            return Ok(new {
                message   = "Leave application submitted successfully.",
                id        = leave.Id,
                status    = leave.Status,
                appliedAt = leave.AppliedAt,
            });
        }

        // PUT /api/leave/{id}/action — admin approves or rejects
        [HttpPut("{id}/action")]
        public IActionResult ActionLeave(int id, [FromBody] LeaveActionDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Request body is empty." });

            var leave = _context.Leaves.FirstOrDefault(l => l.Id == id);
            if (leave == null)
                return NotFound(new { message = "Leave request not found." });

            if (dto.Status != "Approved" && dto.Status != "Rejected")
                return BadRequest(new { message = "Status must be Approved or Rejected." });

            leave.Status      = dto.Status;
            leave.AdminRemark = dto.AdminRemark ?? "";
            leave.UpdatedAt   = DateTime.Now.ToString("o");

            // Notify the student/staff about the decision
            var notifType = dto.Status == "Approved" ? "success" : "error";
            var notif = new Notification
            {
                UserId    = leave.UserId,
                Title     = $"Leave {dto.Status}",
                Message   = dto.Status == "Approved"
                    ? $"Your leave from {leave.FromDate} to {leave.ToDate} has been approved.{(string.IsNullOrWhiteSpace(dto.AdminRemark) ? "" : $" Remark: {dto.AdminRemark}")}"
                    : $"Your leave from {leave.FromDate} to {leave.ToDate} has been rejected.{(string.IsNullOrWhiteSpace(dto.AdminRemark) ? "" : $" Reason: {dto.AdminRemark}")}",
                Type      = notifType,
                IsRead    = false,
                CreatedAt = DateTime.Now.ToString("o"),
                Role      = leave.UserRole.ToLower(),
            };
            _context.Notifications.Add(notif);
            _context.SaveChanges();

            return Ok(new {
                message   = $"Leave {dto.Status.ToLower()} successfully.",
                id        = leave.Id,
                status    = leave.Status,
                updatedAt = leave.UpdatedAt,
            });
        }

        // DELETE /api/leave/{id} — cancel a pending leave
        [HttpDelete("{id}")]
        public IActionResult DeleteLeave(int id)
        {
            var leave = _context.Leaves.FirstOrDefault(l => l.Id == id);
            if (leave == null)
                return NotFound(new { message = "Leave not found." });

            if (leave.Status != "Pending")
                return BadRequest(new { message = "Only pending leaves can be cancelled." });

            _context.Leaves.Remove(leave);
            _context.SaveChanges();

            return Ok(new { message = "Leave cancelled." });
        }
    }
}
