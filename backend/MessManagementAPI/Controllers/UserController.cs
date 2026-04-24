using Microsoft.AspNetCore.Mvc;
using MessManagementAPI.Data;
using MessManagementAPI.Models;
using System.Linq;

namespace MessManagementAPI.Controllers
{
    // ── Simple DTO — no model annotations, no validation errors ──
    public class UpdateUserDto
    {
        public string Name     { get; set; }
        public string Username { get; set; }
        public string Email    { get; set; }
        public string Password { get; set; }
        public string Role     { get; set; }
        public string Course   { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        // GET ALL USERS
        [HttpGet]
        public IActionResult GetUsers()
        {
            var users = _context.Users.ToList();
            return Ok(users);
        }

        // UPDATE USER
        // Uses a plain DTO instead of the User model to avoid annotation-based validation errors
        [HttpPut("{id}")]
        public IActionResult UpdateUser(int id, [FromBody] UpdateUserDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Request body is empty." });

            var displayName = string.IsNullOrWhiteSpace(dto.Name)
                ? dto.Username?.Trim()
                : dto.Name.Trim();

            if (string.IsNullOrWhiteSpace(displayName))
                return BadRequest(new { message = "Name is required." });

            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { message = "Email is required." });

            if (string.IsNullOrWhiteSpace(dto.Role))
                return BadRequest(new { message = "Role is required." });

            var user = _context.Users.Find(id);

            if (user == null)
                return NotFound(new { message = $"User with ID {id} not found." });

            user.Name  = displayName;
            user.Email = dto.Email.Trim();
            user.Role  = dto.Role.Trim();

            if (!string.IsNullOrWhiteSpace(dto.Password))
                user.Password = dto.Password.Trim();

            user.Course = user.Role.Equals("Student", StringComparison.OrdinalIgnoreCase)
                ? (dto.Course ?? user.Course ?? "")
                : "";

            _context.SaveChanges();

            return Ok(new {
                id     = user.Id,
                name   = user.Name,
                email  = user.Email,
                role   = user.Role,
                course = user.Course
            });
        }

        // DELETE USER
        [HttpDelete("{id}")]
        public IActionResult DeleteUser(int id)
        {
            var user = _context.Users.Find(id);

            if (user == null)
                return NotFound(new { message = $"User with ID {id} not found." });

            _context.Users.Remove(user);
            _context.SaveChanges();

            return Ok(new { message = "User deleted successfully." });
        }
    }
}
