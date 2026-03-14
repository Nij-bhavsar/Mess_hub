using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MessManagementAPI.Data;
using MessManagementAPI.Models;
using System.Linq;

namespace MessManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StudentController(AppDbContext context)
        {
            _context = context;
        }

        // GET ALL STUDENTS
        [HttpGet]
public IActionResult GetStudents()
{
    var students = _context.Students
                           .OrderBy(s => s.Id)
                           .ToList();

    return Ok(students);
}

        // ADD STUDENT
        [HttpPost]
        public IActionResult AddStudent([FromBody] Student student)
        {
            _context.Students.Add(student);
            _context.SaveChanges();
            return Ok(student);
        }

        // UPDATE STUDENT
        [HttpPut("{id}")]
        public IActionResult UpdateStudent(int id, [FromBody] Student updatedStudent)
        {
            var student = _context.Students.FirstOrDefault(s => s.Id == id && !s.IsDeleted);

            if (student == null)
                return NotFound();

            student.Name = updatedStudent.Name;
            student.Email = updatedStudent.Email;
            student.Course = updatedStudent.Course;

            _context.SaveChanges();

            return Ok(student);
        }

        // DELETE STUDENT
        [HttpDelete("{id}")]
public IActionResult DeleteStudent(int id)
{
    var student = _context.Students.Find(id);

    if (student == null)
    {
        return NotFound();
    }

    // Delete student
    _context.Students.Remove(student);
    _context.SaveChanges();

    // Reorder IDs
    var students = _context.Students
                           .OrderBy(s => s.Id)
                           .ToList();

    int newId = 1;

    foreach (var s in students)
    {
        s.Id = newId;
        newId++;
    }

    _context.SaveChanges();

    return Ok();
}

        // CLEANUP - Hard delete soft-deleted records to fix ID gaps
        [HttpPost("cleanup-deleted")]
        public IActionResult CleanupDeletedRecords()
        {
            var deletedStudents = _context.Students.Where(s => s.IsDeleted).ToList();
            _context.Students.RemoveRange(deletedStudents);
            _context.SaveChanges();

            return Ok(new { message = $"Removed {deletedStudents.Count} soft-deleted records" });
        }

        // CONSOLIDATE-IDS - Consolidate student IDs to remove gaps (temporary helper)
        [HttpPost("consolidate-ids")]
        public IActionResult ConsolidateIds()
        {
            try
            {
                var students = _context.Students.Where(s => !s.IsDeleted).OrderBy(s => s.Id).ToList();
                
                if (students.Count == 0)
                    return Ok(new { message = "No active students to consolidate" });

                // Temporarily disable identity insert
                _context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT [Students] ON");

                // Renumber students sequentially
                for (int i = 0; i < students.Count; i++)
                {
                    students[i].Id = i + 1;
                }

                // Re-enable identity insert
                _context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT [Students] OFF");

                _context.SaveChanges();

                return Ok(new { message = $"Renumbered {students.Count} students to have sequential IDs (1 to {students.Count})" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}