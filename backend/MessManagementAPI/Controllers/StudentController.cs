using Microsoft.AspNetCore.Mvc;
using MessManagementAPI.Data;
using MessManagementAPI.Models;

namespace MessManagementAPI.Controllers
{
    // DTOs for student operations
    public class StudentCreateDto
    {
        public string Name     { get; set; } = "";
        public string Email    { get; set; } = "";
        public string Course   { get; set; } = "";
        public string Password { get; set; } = "Student@123";
    }

    public class StudentUpdateDto
    {
        public string Name   { get; set; } = "";
        public string Email  { get; set; } = "";
        public string Course { get; set; } = "";
    }

    [ApiController]
    [Route("api/[controller]")]
    public class StudentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StudentController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/student
        // Returns all users with Role = "Student"
        [HttpGet]
        public IActionResult GetStudents()
        {
            var students = _context.Users
                .Where(u => u.Role.ToLower() == "student")
                .Select(u => new
                {
                    id     = u.Id,
                    name   = u.Name,
                    email  = u.Email,
                    course = u.Course ?? "",
                    role   = u.Role,
                })
                .ToList();

            return Ok(students);
        }

        // GET /api/student/{id}
        [HttpGet("{id}")]
        public IActionResult GetStudent(int id)
        {
            var u = _context.Users
                .FirstOrDefault(u => u.Id == id && u.Role.ToLower() == "student");

            if (u == null)
                return NotFound(new { message = "Student not found." });

            return Ok(new
            {
                id     = u.Id,
                name   = u.Name,
                email  = u.Email,
                course = u.Course ?? "",
                role   = u.Role,
            });
        }

        // POST /api/student
        // Creates a student in Users table — auto-creates login account
        [HttpPost]
        public IActionResult CreateStudent([FromBody] StudentCreateDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Request body is empty." });

            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { message = "Email is required." });

            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Name is required." });

            // Check if email already exists
            var existing = _context.Users.FirstOrDefault(u => u.Email == dto.Email);
            if (existing != null)
                return BadRequest(new { message = "A user with this email already exists." });

            var student = new User
            {
                Name     = dto.Name,
                Email    = dto.Email,
                Password = string.IsNullOrWhiteSpace(dto.Password) ? "Student@123" : dto.Password,
                Role     = "Student",
                Course   = dto.Course ?? "",
            };

            _context.Users.Add(student);
            _context.SaveChanges();

            return Ok(new
            {
                message = "Student created successfully. They can login with the provided credentials.",
                id      = student.Id,
                name    = student.Name,
                email   = student.Email,
                course  = student.Course,
                role    = student.Role,
            });
        }

        // PUT /api/student/{id}
        // Updates student in Users table
        [HttpPut("{id}")]
        public IActionResult UpdateStudent(int id, [FromBody] StudentUpdateDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Request body is empty." });

            var student = _context.Users
                .FirstOrDefault(u => u.Id == id && u.Role.ToLower() == "student");

            if (student == null)
                return NotFound(new { message = "Student not found." });

            if (!string.IsNullOrWhiteSpace(dto.Name))  student.Name   = dto.Name;
            if (!string.IsNullOrWhiteSpace(dto.Email)) student.Email  = dto.Email;
            if (!string.IsNullOrWhiteSpace(dto.Course)) student.Course = dto.Course;

            _context.SaveChanges();

            return Ok(new
            {
                message = "Student updated successfully.",
                id      = student.Id,
                name    = student.Name,
                email   = student.Email,
                course  = student.Course,
                role    = student.Role,
            });
        }

        // DELETE /api/student/{id}
        // Deletes from Users table — removes login account too
        [HttpDelete("{id}")]
        public IActionResult DeleteStudent(int id)
        {
            var student = _context.Users
                .FirstOrDefault(u => u.Id == id && u.Role.ToLower() == "student");

            if (student == null)
                return NotFound(new { message = "Student not found." });

            _context.Users.Remove(student);
            _context.SaveChanges();

            return Ok(new { message = "Student and their login account deleted." });
        }
    }
}