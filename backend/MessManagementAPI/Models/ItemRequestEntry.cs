namespace MessManagementAPI.Models
{
    public class ItemRequestEntry
    {
        public int    Id           { get; set; }
        public int    UserId       { get; set; }
        public string UserName     { get; set; } = "";
        public string UserRole     { get; set; } = ""; // Student or Staff
        public string ItemName     { get; set; } = "";
        public string Category     { get; set; } = "";
        public string Priority     { get; set; } = "Medium";
        public string Note         { get; set; } = "";
        public string Status       { get; set; } = "Pending"; // Pending, Approved, Rejected
        public string AdminRemark  { get; set; } = "";
        public string CreatedAt    { get; set; } = "";
        public string UpdatedAt    { get; set; } = "";
    }
}