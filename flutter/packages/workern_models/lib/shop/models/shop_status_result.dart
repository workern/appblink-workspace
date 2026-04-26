/// Result model for shop status check
class ShopStatusResult {
  final bool acceptingOrders;
  final bool canSchedule;
  final String status; // 'open', 'closed_can_schedule', 'closed_unavailable'
  final String message;

  ShopStatusResult({
    required this.acceptingOrders,
    required this.canSchedule,
    required this.status,
    required this.message,
  });
}
