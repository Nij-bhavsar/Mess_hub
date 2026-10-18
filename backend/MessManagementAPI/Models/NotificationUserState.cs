namespace MessManagementAPI.Models
{
    // Per-user state for a notification.  Broadcast notifications must not share
    // their read or deleted state between recipients.
    public class NotificationUserState
    {
        public int NotificationId { get; set; }
        public int UserId         { get; set; }
        public bool IsRead        { get; set; }
        public bool IsDeleted     { get; set; }
    }
}
