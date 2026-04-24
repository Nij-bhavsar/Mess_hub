using Microsoft.AspNetCore.Mvc;
using MessManagementAPI.Data;
using MessManagementAPI.Models;

namespace MessManagementAPI.Controllers
{
    // ── Simple DTOs — avoids model binding issues with User entity ──
    public class LoginDto
    {
        public string Email    { get; set; } = "";
        public string Password { get; set; } = "";
        public string Role     { get; set; } = "";
    }

    public class SignupDto
    {
        public string Name     { get; set; } = "";
        public string Email    { get; set; } = "";
        public string Password { get; set; } = "";
        public string Role     { get; set; } = "Student";
        public string Course   { get; set; } = "";
    }

    public class ForgotPasswordDto
    {
        public string Email       { get; set; } = "";
        public string Password    { get; set; } = "";
        public string NewPassword { get; set; } = "";
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        // POST /api/auth/signup
        [HttpPost("signup")]
        public IActionResult Signup([FromBody] SignupDto model)
        {
            if (model == null)
                return BadRequest(new { message = "Request body is empty." });

            if (string.IsNullOrWhiteSpace(model.Email))
                return BadRequest(new { message = "Email is required." });

            if (string.IsNullOrWhiteSpace(model.Password))
                return BadRequest(new { message = "Password is required." });

            // Check if email already exists
            var existing = _context.Users
                .FirstOrDefault(u => u.Email == model.Email);

            if (existing != null)
                return BadRequest(new { message = "Email already registered." });

            var user = new User
            {
                Name     = model.Name  ?? "",
                Email    = model.Email,
                Password = model.Password,
                Role     = model.Role  ?? "Student",
                Course   = (model.Role == "Student" || string.IsNullOrEmpty(model.Role))
                            ? (model.Course ?? "")
                            : "",
            };

            _context.Users.Add(user);
            _context.SaveChanges();

            return Ok(new
            {
                message = "Account created successfully",
                id      = user.Id,
                name    = user.Name,
                email   = user.Email,
                role    = user.Role,
                course  = user.Course,
            });
        }

        // POST /api/auth/login
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto model)
        {
            if (model == null)
                return BadRequest(new { message = "Request body is empty." });

            if (string.IsNullOrWhiteSpace(model.Email))
                return BadRequest(new { message = "Email is required." });

            if (string.IsNullOrWhiteSpace(model.Password))
                return BadRequest(new { message = "Password is required." });

            // Step 1 — find by email + password (trim whitespace, case-insensitive email)
            var email    = model.Email.Trim().ToLower();
            var password = model.Password.Trim();

            // Debug log — shows in dotnet run console
            Console.WriteLine($"[LOGIN] Attempting: email={email}, role={model.Role}");
            Console.WriteLine($"[LOGIN] Total users in DB: {_context.Users.Count()}");

            var user = _context.Users.FirstOrDefault(u =>
                u.Email.ToLower() == email &&
                u.Password        == password);

            Console.WriteLine($"[LOGIN] User found by email+password: {user != null}");

            if (user == null)
                return Unauthorized(new { message = "Invalid email or password." });

            // Step 2 — role check (case-insensitive, only if role was sent)
            if (!string.IsNullOrWhiteSpace(model.Role) &&
                !user.Role.Equals(model.Role, StringComparison.OrdinalIgnoreCase))
                return Unauthorized(new
                {
                    message = $"Access denied. Your account role is \"{user.Role}\" but you selected \"{model.Role}\"."
                });

            return Ok(new
            {
                id     = user.Id,
                name   = user.Name,
                email  = user.Email,
                role   = user.Role,
                // Only return course for Student role
                course = user.Role.Equals("Student", StringComparison.OrdinalIgnoreCase)
                         ? (user.Course ?? "")
                         : "",
            });
        }

        // POST /api/auth/forgot-password
        [HttpPost("forgot-password")]
        public IActionResult ForgotPassword([FromBody] ForgotPasswordDto model)
        {
            if (model == null)
                return BadRequest(new { message = "Request body is empty." });

            if (string.IsNullOrWhiteSpace(model.Email))
                return BadRequest(new { message = "Email is required." });

            var email = model.Email.Trim().ToLower();

            var user = _context.Users.FirstOrDefault(u => u.Email.ToLower() == email);

            if (user == null)
                return NotFound(new { message = "No account found with this email." });

            // Accept either Password or NewPassword field
            var newPwd = !string.IsNullOrWhiteSpace(model.NewPassword)
                ? model.NewPassword.Trim()
                : model.Password?.Trim();

            if (string.IsNullOrWhiteSpace(newPwd))
                return BadRequest(new { message = "New password is required." });

            user.Password = newPwd;
            _context.SaveChanges();

            return Ok(new { message = "Password updated successfully." });
        }
    }
}
