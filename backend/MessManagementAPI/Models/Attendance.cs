namespace MessManagementAPI.Models
{
    public class Attendance
    {
        public int    Id        { get; set; }
        public int    StudentId { get; set; }
        public string Date      { get; set; } = "";
        public string Status    { get; set; } = "";   // Present / Absent / Leave
        public string MealType  { get; set; } = "Breakfast & Lunch";
    }
}