namespace MessManagementAPI.Models
{
    public class Notification
    {
        public int    Id        { get; set; }
        public int    UserId    { get; set; }   // 0 = broadcast to all
        public string Title     { get; set; } = "";
        public string Message   { get; set; } = "";
        public string Type      { get; set; } = "info"; // info, success, warning, error
        public bool   IsRead    { get; set; } = false;
        public string CreatedAt { get; set; } = "";
        public string Role      { get; set; } = ""; // target role, empty = all
    }
}