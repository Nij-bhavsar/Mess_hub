using Microsoft.EntityFrameworkCore;
using MessManagementAPI.Models;

namespace MessManagementAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }

        public DbSet<Student> Students { get; set; }

        public DbSet<Menu> Menus { get; set; }

        public DbSet<Attendance> Attendances { get; set; }

        public DbSet<Payment>    Payments    { get; set; }

        public DbSet<Leave>        Leaves        { get; set; }
        
        public DbSet<Notification> Notifications { get; set; }

        public DbSet<NotificationUserState> NotificationUserStates { get; set; }

        public DbSet<FeedbackEntry>    Feedbacks      { get; set; }

        public DbSet<ItemRequestEntry> ItemRequests   { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<NotificationUserState>()
                .HasKey(state => new { state.NotificationId, state.UserId });
        }
    }
}
