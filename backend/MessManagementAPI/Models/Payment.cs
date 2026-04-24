namespace MessManagementAPI.Models
{
    public class Payment
    {
        public int    Id          { get; set; }
        public int    StudentId   { get; set; }
        public string StudentName { get; set; } = "";
        public string Plan        { get; set; } = "";
        public decimal Amount     { get; set; }
        public string Method      { get; set; } = "";
        public string Status      { get; set; } = "Paid";
        public string PaidAt      { get; set; } = "";
        public string ReceiptId   { get; set; } = "";
    }
}