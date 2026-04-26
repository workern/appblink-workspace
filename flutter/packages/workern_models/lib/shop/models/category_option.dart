/// Category option for shop
class CategoryOption {
  final String value;
  final String label;

  CategoryOption({required this.value, required this.label});
}

/// List of available shop categories
final List<CategoryOption> shopCategoryOptions = [
  CategoryOption(value: '', label: 'Select a category'),
  CategoryOption(value: 'groceries', label: '🛒 Groceries'),
  CategoryOption(value: 'medical', label: '💊 Medical'),
  CategoryOption(value: 'electronics', label: '📱 Electronics'),
  CategoryOption(value: 'clothing', label: '👕 Clothing'),
  CategoryOption(value: 'restaurant', label: '🍽️ Restaurant'),
  CategoryOption(value: 'hardware', label: '🔧 Hardware Store'),
  CategoryOption(value: 'beauty', label: '💄 Beauty & Cosmetics'),
  CategoryOption(value: 'books', label: '📚 Books & Stationery'),
  CategoryOption(value: 'sports', label: '⚽ Sports & Fitness'),
  CategoryOption(value: 'jewelry', label: '💍 Jewelry'),
  CategoryOption(value: 'automotive', label: '🚗 Automotive'),
  CategoryOption(value: 'furniture', label: '🪑 Furniture'),
  CategoryOption(value: 'toys', label: '🧸 Toys & Games'),
  CategoryOption(value: 'other', label: '📦 Other'),
];
