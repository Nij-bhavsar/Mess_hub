namespace MessManagementAPI.Models
{
    public class FeedbackEntry
    {
        public int    Id          { get; set; }
        public int?   StudentId   { get; set; }
        public string StudentName { get; set; } = "";
        public string Category    { get; set; } = "";
        public int    Rating      { get; set; }
        public string Message     { get; set; } = "";
        public bool   Anonymous   { get; set; } = false;
        public string Status      { get; set; } = "Pending"; // Pending, Reviewed, Resolved
        public string AdminReply  { get; set; } = "";
        public string SubmittedAt { get; set; } = "";
        public string ReviewedAt  { get; set; } = "";
    }
}