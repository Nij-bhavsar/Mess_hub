namespace MessManagementAPI.Models
{
    public class Menu
    {
        public int Id { get; set; }

        public string? Day { get; set; }

        public string? Breakfast { get; set; }

        public string? Lunch { get; set; }

        public string? Dinner { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }
}
