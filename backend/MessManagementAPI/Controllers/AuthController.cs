using Microsoft.AspNetCore.Mvc;
using MessManagementAPI.Data;
using MessManagementAPI.Models;
using System.Linq;

namespace MessManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        // SIGNUP
        [HttpPost("signup")]
        public IActionResult Signup(User user)
        {
            // Check if admin already exists
            if (user.Role == "Admin")
            {
                var adminExists = _context.Users.Any(u => u.Role == "Admin");

                if (adminExists)
                {
                    return BadRequest("Admin already exists. Only one admin allowed.");
                }
            }

            // Check duplicate email
            var emailExists = _context.Users.Any(u => u.Email == user.Email);

            if (emailExists)
            {
                return BadRequest("Email already registered.");
            }

            _context.Users.Add(user);
            _context.SaveChanges();

            return Ok(new { message = "Signup successful" });
        }

        // LOGIN
        [HttpPost("login")]
        public IActionResult Login(LoginModel login)
        {
            var user = _context.Users
                .FirstOrDefault(u => u.Email == login.Email && u.Password == login.Password);

            if (user == null)
            {
                return BadRequest("Invalid email or password");
            }

            return Ok(new
            {
                user.Id,
                user.Name,
                user.Email,
                user.Role
            });
        }
    }
}