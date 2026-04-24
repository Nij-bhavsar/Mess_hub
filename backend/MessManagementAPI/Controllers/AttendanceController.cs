using Microsoft.AspNetCore.Mvc;
using MessManagementAPI.Data;
using MessManagementAPI.Models;

namespace MessManagementAPI.Controllers
{
    public class AttendanceDto
    {
        public int    StudentId { get; set; }
        public string Date      { get; set; } = "";
        public string Status    { get; set; } = "";
        public string MealType  { get; set; } = "Breakfast & Lunch";
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AttendanceController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/attendance
        // Supports ?date=2024-01-01 and/or ?studentId=5
        [HttpGet]
        public IActionResult GetAttendance(
            [FromQuery] string? date      = null,
            [FromQuery] int?    studentId = null)
        {
            var query = _context.Attendances.AsQueryable();

            if (!string.IsNullOrWhiteSpace(date))
                query = query.Where(a => a.Date == date);

            if (studentId.HasValue)
                query = query.Where(a => a.StudentId == studentId.Value);

            var result = query
                .OrderByDescending(a => a.Date)
                .Select(a => new
                {
                    id        = a.Id,
                    studentId = a.StudentId,
                    date      = a.Date,
                    status    = a.Status,
                    mealType  = a.MealType,
                })
                .ToList();

            return Ok(result);
        }

        // GET /api/attendance/{studentId}/{date}
        // Get a specific student's record for a specific date
        [HttpGet("{studentId}/{date}")]
        public IActionResult GetRecord(int studentId, string date)
        {
            var record = _context.Attendances
                .FirstOrDefault(a => a.StudentId == studentId && a.Date == date);

            if (record == null)
                return Ok(null); // return null not 404 so frontend handles gracefully

            return Ok(new
            {
                id        = record.Id,
                studentId = record.StudentId,
                date      = record.Date,
                status    = record.Status,
                mealType  = record.MealType,
            });
        }

        // POST /api/attendance
        // Mark attendance for a student
        [HttpPost]
        public IActionResult CreateAttendance([FromBody] AttendanceDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Request body is empty." });

            if (string.IsNullOrWhiteSpace(dto.Date))
                return BadRequest(new { message = "Date is required." });

            if (string.IsNullOrWhiteSpace(dto.Status))
                return BadRequest(new { message = "Status is required." });

            // Check if record already exists for this student + date
            var existing = _context.Attendances
                .FirstOrDefault(a => a.StudentId == dto.StudentId && a.Date == dto.Date);

            if (existing != null)
            {
                // Update instead of creating duplicate
                existing.Status   = dto.Status;
                existing.MealType = dto.MealType ?? "Breakfast & Lunch";
                _context.SaveChanges();
                return Ok(new
                {
                    id        = existing.Id,
                    studentId = existing.StudentId,
                    date      = existing.Date,
                    status    = existing.Status,
                    mealType  = existing.MealType,
                });
            }

            var record = new Attendance
            {
                StudentId = dto.StudentId,
                Date      = dto.Date,
                Status    = dto.Status,
                MealType  = dto.MealType ?? "Breakfast & Lunch",
            };

            _context.Attendances.Add(record);
            _context.SaveChanges();

            return Ok(new
            {
                id        = record.Id,
                studentId = record.StudentId,
                date      = record.Date,
                status    = record.Status,
                mealType  = record.MealType,
            });
        }

        // PUT /api/attendance/{id}
        // Update an existing attendance record
        [HttpPut("{id}")]
        public IActionResult UpdateAttendance(int id, [FromBody] AttendanceDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Request body is empty." });

            var record = _context.Attendances.FirstOrDefault(a => a.Id == id);

            if (record == null)
                return NotFound(new { message = "Attendance record not found." });

            if (!string.IsNullOrWhiteSpace(dto.Status))   record.Status   = dto.Status;
            if (!string.IsNullOrWhiteSpace(dto.Date))     record.Date     = dto.Date;
            if (!string.IsNullOrWhiteSpace(dto.MealType)) record.MealType = dto.MealType;

            _context.SaveChanges();

            return Ok(new
            {
                id        = record.Id,
                studentId = record.StudentId,
                date      = record.Date,
                status    = record.Status,
                mealType  = record.MealType,
            });
        }

        // DELETE /api/attendance/{id}
        [HttpDelete("{id}")]
        public IActionResult DeleteAttendance(int id)
        {
            var record = _context.Attendances.FirstOrDefault(a => a.Id == id);

            if (record == null)
                return NotFound(new { message = "Record not found." });

            _context.Attendances.Remove(record);
            _context.SaveChanges();

            return Ok(new { message = "Attendance record deleted." });
        }
    }
}