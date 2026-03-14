using Microsoft.AspNetCore.Mvc;
using MessManagementAPI.Data;
using MessManagementAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace MessManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MenuController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MenuController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetAllMenus()
        {
            var menus = _context.Menus.OrderByDescending(m => m.CreatedAt).ToList();
            return Ok(menus);
        }

        [HttpGet("{id}")]
        public IActionResult GetMenuById(int id)
        {
            var menu = _context.Menus.Find(id);
            if (menu == null)
                return NotFound("Menu not found");

            return Ok(menu);
        }

        [HttpPost]
        public IActionResult CreateMenu(Menu menu)
        {
            try
            {
                menu.CreatedAt = DateTime.Now;
                menu.UpdatedAt = DateTime.Now;
                _context.Menus.Add(menu);
                _context.SaveChanges();
                return Ok(menu);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        public IActionResult UpdateMenu(int id, Menu menu)
        {
            var existingMenu = _context.Menus.Find(id);
            if (existingMenu == null)
                return NotFound("Menu not found");

            try
            {
                existingMenu.Day = menu.Day;
                existingMenu.Breakfast = menu.Breakfast;
                existingMenu.Lunch = menu.Lunch;
                existingMenu.Dinner = menu.Dinner;
                existingMenu.UpdatedAt = DateTime.Now;

                _context.Menus.Update(existingMenu);
                _context.SaveChanges();
                return Ok(existingMenu);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteMenu(int id)
        {
            var menu = _context.Menus.Find(id);
            if (menu == null)
                return NotFound("Menu not found");

            try
            {
                _context.Menus.Remove(menu);
                _context.SaveChanges();
                return Ok("Menu deleted successfully");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
