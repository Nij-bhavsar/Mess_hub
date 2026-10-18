using Microsoft.AspNetCore.Mvc;
using MessManagementAPI.Data;
using MessManagementAPI.Models;

namespace MessManagementAPI.Controllers
{
    public class NotificationCreateDto
    {
        public int    UserId  { get; set; } = 0;  // 0 = all users
        public string Title   { get; set; } = "";
        public string Message { get; set; } = "";
        public string Type    { get; set; } = "info";
        public string Role    { get; set; } = "";  // student, staff, admin, empty = all
    }

    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/notification?userId=X&role=student
        [HttpGet]
        public IActionResult GetNotifications(
            [FromQuery] int?    userId = null,
            [FromQuery] string? role   = null)
        {
            var query = _context.Notifications.AsQueryable();

            if (userId.HasValue && !string.IsNullOrWhiteSpace(role))
            {
                // Return notifications for this specific user OR broadcast to their role OR broadcast to all
                query = query.Where(n =>
                    n.UserId == userId.Value ||
                    n.UserId == 0 && (n.Role.ToLower() == role.ToLower() || n.Role == "") ||
                    role.ToLower() == "admin" && n.Role.ToLower() == "admin"
                );
            }
            else if (userId.HasValue)
            {
                query = query.Where(n => n.UserId == userId.Value || n.UserId == 0);
            }

            var notifications = query
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .ToList();

            var states = userId.HasValue
                ? _context.NotificationUserStates
                    .Where(state => state.UserId == userId.Value &&
                        notifications.Select(notification => notification.Id).Contains(state.NotificationId))
                    .ToDictionary(state => state.NotificationId)
                : new Dictionary<int, NotificationUserState>();

            var result = notifications
                .Where(notification => !states.TryGetValue(notification.Id, out var state) || !state.IsDeleted)
                .Select(n => new {
                    id        = n.Id,
                    userId    = n.UserId,
                    title     = n.Title,
                    message   = n.Message,
                    type      = n.Type,
                    isRead    = states.TryGetValue(n.Id, out var state) ? state.IsRead : n.IsRead,
                    createdAt = n.CreatedAt,
                    role      = n.Role,
                }).ToList();

            return Ok(result);
        }

        // GET /api/notification/unread-count?userId=X&role=student
        [HttpGet("unread-count")]
        public IActionResult GetUnreadCount(
            [FromQuery] int?    userId = null,
            [FromQuery] string? role   = null)
        {
            var query = _context.Notifications.AsQueryable();

            if (userId.HasValue && !string.IsNullOrWhiteSpace(role))
            {
                query = query.Where(n =>
                    n.UserId == userId.Value || (n.UserId == 0 && (n.Role.ToLower() == role.ToLower() || n.Role == "")) ||
                    role.ToLower() == "admin" && n.Role.ToLower() == "admin"
                );
            }
            else if (userId.HasValue)
            {
                query = query.Where(n => n.UserId == userId.Value || n.UserId == 0);
            }

            if (!userId.HasValue)
                return Ok(new { count = query.Count() });

            var notifications = query.ToList();
            var states = _context.NotificationUserStates
                .Where(state => state.UserId == userId.Value &&
                    notifications.Select(notification => notification.Id).Contains(state.NotificationId))
                .ToDictionary(state => state.NotificationId);

            var count = notifications.Count(notification =>
            {
                states.TryGetValue(notification.Id, out var state);
                return (state == null || !state.IsDeleted) && !(state?.IsRead ?? notification.IsRead);
            });

            return Ok(new { count });
        }

        // PUT /api/notification/{id}/read — mark single notification as read
        [HttpPut("{id}/read")]
        public IActionResult MarkRead(int id, [FromQuery] int userId)
        {
            var notif = _context.Notifications.FirstOrDefault(n => n.Id == id);
            if (notif == null)
                return NotFound();

            var state = GetOrCreateState(id, userId);
            state.IsRead = true;
            _context.SaveChanges();
            return Ok(new { message = "Marked as read." });
        }

        // PUT /api/notification/read-all?userId=X — mark all as read
        [HttpPut("read-all")]
        public IActionResult MarkAllRead([FromQuery] int userId, [FromQuery] string? role = null)
        {
            var notifs = _context.Notifications
                .Where(n => n.UserId == userId ||
                    (n.UserId == 0 && (string.IsNullOrWhiteSpace(role) || n.Role.ToLower() == role.ToLower() || n.Role == "")) ||
                    (!string.IsNullOrWhiteSpace(role) && role.ToLower() == "admin" && n.Role.ToLower() == "admin"))
                .ToList();

            foreach (var notification in notifs)
            {
                var state = GetOrCreateState(notification.Id, userId);
                state.IsRead = true;
            }
            _context.SaveChanges();

            return Ok(new { message = "All marked as read.", count = notifs.Count });
        }

        // POST /api/notification — admin creates broadcast notification
        [HttpPost]
        public IActionResult CreateNotification([FromBody] NotificationCreateDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest(new { message = "Message is required." });

            var notif = new Notification
            {
                UserId    = dto.UserId,
                Title     = dto.Title,
                Message   = dto.Message,
                Type      = dto.Type ?? "info",
                IsRead    = false,
                CreatedAt = DateTime.Now.ToString("o"),
                Role      = dto.Role ?? "",
            };

            _context.Notifications.Add(notif);
            _context.SaveChanges();

            return Ok(new { message = "Notification sent.", id = notif.Id });
        }

        // DELETE /api/notification/{id}
        [HttpDelete("{id}")]
        public IActionResult DeleteNotification(int id, [FromQuery] int userId)
        {
            var notif = _context.Notifications.FirstOrDefault(n => n.Id == id);
            if (notif == null)
                return NotFound();

            var state = GetOrCreateState(id, userId);
            state.IsDeleted = true;
            _context.SaveChanges();
            return Ok(new { message = "Deleted for this user." });
        }

        private NotificationUserState GetOrCreateState(int notificationId, int userId)
        {
            var state = _context.NotificationUserStates
                .FirstOrDefault(s => s.NotificationId == notificationId && s.UserId == userId);

            if (state != null)
                return state;

            state = new NotificationUserState { NotificationId = notificationId, UserId = userId };
            _context.NotificationUserStates.Add(state);
            return state;
        }
    }
}
