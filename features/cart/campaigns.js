/**
 * Compares every eligible basket campaign and returns the highest discount.
 * Unit prices are supplied separately so quantity-based campaigns stay simple
 * and testable outside the interface.
 */
export function selectBestCampaign(unitPrices, subtotal) {
  const candidates = [
    {
      name: "Sepette %10",
      discount: subtotal * 0.1,
      message: "Tüm sepete %10 indirim uygulandı.",
    },
  ];

  if (unitPrices.length >= 2) {
    const sorted = [...unitPrices].sort((a, b) => a - b);
    const discountedItems = sorted.filter((_, index) => index % 2 === 0);
    candidates.push({
      name: "2. üründe %25",
      discount:
        discountedItems.reduce((sum, price) => sum + price, 0) * 0.25,
      message: "Her ürün çiftindeki uygun fiyatlı ürüne %25 indirim uygulandı.",
    });
  }

  if (subtotal >= 600) {
    candidates.push({
      name: "600 TL üzeri 50 TL",
      discount: 50,
      message: "600 TL üzeri alışveriş indirimi uygulandı.",
    });
  }

  if (unitPrices.length >= 3) {
    candidates.push({
      name: "3 ürün al %20",
      discount: subtotal * 0.2,
      message: "Üç veya daha fazla ürüne %20 indirim uygulandı.",
    });
  }

  if (unitPrices.length >= 4) {
    const sorted = [...unitPrices].sort((a, b) => a - b);
    candidates.push({
      name: "4 al 2 öde",
      discount: sorted[0] + sorted[1],
      message: "Sepetteki en uygun iki ürün hediye edildi.",
    });
  }

  return candidates.reduce((best, item) =>
    item.discount > best.discount ? item : best,
  );
}
