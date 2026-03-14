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
    }
}