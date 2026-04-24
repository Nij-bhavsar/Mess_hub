namespace MessManagementAPI.Models
{
    public class Leave
    {
        public int    Id          { get; set; }
        public int    UserId      { get; set; }
        public string UserName    { get; set; } = "";
        public string UserRole    { get; set; } = ""; // Student or Staff
        public string FromDate    { get; set; } = "";
        public string ToDate      { get; set; } = "";
        public string Reason      { get; set; } = "";
        public string LeaveType   { get; set; } = ""; // Sick, Personal, Academic, Other
        public string Status      { get; set; } = "Pending"; // Pending, Approved, Rejected
        public string AdminRemark { get; set; } = "";
        public string AppliedAt   { get; set; } = "";
        public string UpdatedAt   { get; set; } = "";
    }
}