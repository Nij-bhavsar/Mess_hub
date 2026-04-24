using Microsoft.AspNetCore.Mvc;
using MessManagementAPI.Data;
using MessManagementAPI.Models;

namespace MessManagementAPI.Controllers
{
    public class ItemRequestDto
    {
        public int    UserId   { get; set; }
        public string UserName { get; set; } = "";
        public string UserRole { get; set; } = "";
        public string ItemName { get; set; } = "";
        public string Category { get; set; } = "";
        public string Priority { get; set; } = "Medium";
        public string Note     { get; set; } = "";
    }

    public class ItemRequestActionDto
    {
        public string Status      { get; set; } = "";
        public string AdminRemark { get; set; } = "";
    }

    [ApiController]
    [Route("api/itemrequest")]
    public class ItemRequestController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ItemRequestController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/itemrequest — admin sees all, user sees own
        [HttpGet]
        public IActionResult GetAll(
            [FromQuery] int?    userId = null,
            [FromQuery] string? status = null,
            [FromQuery] string? role   = null)
        {
            var query = _context.ItemRequests.AsQueryable();

            if (userId.HasValue)
                query = query.Where(r => r.UserId == userId.Value);
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(r => r.Status == status);
            if (!string.IsNullOrWhiteSpace(role))
                query = query.Where(r => r.UserRole.ToLower() == role.ToLower());

            var result = query
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new {
                    id          = r.Id,
                    userId      = r.UserId,
                    userName    = r.UserName,
                    userRole    = r.UserRole,
                    itemName    = r.ItemName,
                    category    = r.Category,
                    priority    = r.Priority,
                    note        = r.Note,
                    status      = r.Status,
                    adminRemark = r.AdminRemark,
                    createdAt   = r.CreatedAt,
                    updatedAt   = r.UpdatedAt,
                }).ToList();

            return Ok(result);
        }

        // POST /api/itemrequest — student or staff submits
        [HttpPost]
        public IActionResult Create([FromBody] ItemRequestDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Request body is empty." });

            if (string.IsNullOrWhiteSpace(dto.ItemName))
                return BadRequest(new { message = "Item name is required." });

            var entry = new ItemRequestEntry
            {
                UserId      = dto.UserId,
                UserName    = dto.UserName,
                UserRole    = dto.UserRole,
                ItemName    = dto.ItemName,
                Category    = dto.Category ?? "Food Item",
                Priority    = dto.Priority ?? "Medium",
                Note        = dto.Note ?? "",
                Status      = "Pending",
                AdminRemark = "",
                CreatedAt   = DateTime.Now.ToString("o"),
                UpdatedAt   = DateTime.Now.ToString("o"),
            };

            _context.ItemRequests.Add(entry);

            // Notify admin
            _context.Notifications.Add(new Notification
            {
                UserId    = 0,
                Title     = "New Item Request",
                Message   = $"{dto.UserName} ({dto.UserRole}) requested \"{dto.ItemName}\" ({dto.Priority} priority).",
                Type      = "info",
                IsRead    = false,
                CreatedAt = DateTime.Now.ToString("o"),
                Role      = "admin",
            });

            _context.SaveChanges();

            return Ok(new {
                message   = "Item request submitted.",
                id        = entry.Id,
                status    = entry.Status,
                createdAt = entry.CreatedAt,
            });
        }

        // PUT /api/itemrequest/{id}/action — admin approves or rejects
        [HttpPut("{id}/action")]
        public IActionResult Action(int id, [FromBody] ItemRequestActionDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Request body is empty." });

            var entry = _context.ItemRequests.FirstOrDefault(r => r.Id == id);
            if (entry == null)
                return NotFound(new { message = "Request not found." });

            entry.Status      = dto.Status;
            entry.AdminRemark = dto.AdminRemark ?? "";
            entry.UpdatedAt   = DateTime.Now.ToString("o");

            // Notify requester
            _context.Notifications.Add(new Notification
            {
                UserId    = entry.UserId,
                Title     = $"Item Request {dto.Status}",
                Message   = dto.Status == "Approved"
                    ? $"Your request for \"{entry.ItemName}\" has been approved.{(string.IsNullOrWhiteSpace(dto.AdminRemark) ? "" : $" Note: {dto.AdminRemark}")}"
                    : $"Your request for \"{entry.ItemName}\" has been rejected.{(string.IsNullOrWhiteSpace(dto.AdminRemark) ? "" : $" Reason: {dto.AdminRemark}")}",
                Type      = dto.Status == "Approved" ? "success" : "error",
                IsRead    = false,
                CreatedAt = DateTime.Now.ToString("o"),
                Role      = entry.UserRole.ToLower(),
            });

            _context.SaveChanges();

            return Ok(new { message = $"Request {dto.Status.ToLower()}.", id = entry.Id, status = entry.Status });
        }

        // DELETE /api/itemrequest/{id}
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var entry = _context.ItemRequests.FirstOrDefault(r => r.Id == id);
            if (entry == null) return NotFound();
            if (entry.Status != "Pending")
                return BadRequest(new { message = "Only pending requests can be deleted." });
            _context.ItemRequests.Remove(entry);
            _context.SaveChanges();
            return Ok(new { message = "Request cancelled." });
        }
    }
}