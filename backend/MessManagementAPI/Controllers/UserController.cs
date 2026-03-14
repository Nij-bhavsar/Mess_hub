using Microsoft.AspNetCore.Mvc;
using MessManagementAPI.Data;
using MessManagementAPI.Models;
using System.Linq;

namespace MessManagementAPI.Controllers
{
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
        [HttpPut("{id}")]
        public IActionResult UpdateUser(int id, User updatedUser)
        {
            var user = _context.Users.Find(id);

            if (user == null)
                return NotFound();

            user.Email = updatedUser.Email;
            user.Password = updatedUser.Password;
            user.Role = updatedUser.Role;

            _context.SaveChanges();

            return Ok(user);
        }

        // DELETE USER
        [HttpDelete("{id}")]
        public IActionResult DeleteUser(int id)
        {
            var user = _context.Users.Find(id);

            if (user == null)
                return NotFound();

            _context.Users.Remove(user);
            _context.SaveChanges();

            return Ok();
        }
    }
}