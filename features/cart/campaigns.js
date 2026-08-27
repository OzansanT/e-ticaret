/**
 * Compares every eligible basket campaign and returns the highest discount.
 * Unit prices are supplied separately so quantity-based campaigns stay simple
 * and testable outside the interface.
 */
export function selectBestCampaign(unitPrices, subtotal, configuredRules = []) {
  const candidates = [
    {
      name: "Lorem ipsum %10",
      discount: subtotal * 0.1,
      message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    },
  ];

  if (unitPrices.length >= 2) {
    const sorted = [...unitPrices].sort((a, b) => a - b);
    const discountedItems = sorted.filter((_, index) => index % 2 === 0);
    candidates.push({
      name: "Dolor sit amet %25",
      discount:
        discountedItems.reduce((sum, price) => sum + price, 0) * 0.25,
      message: "Sed do eiusmod tempor incididunt ut labore et dolore.",
    });
  }

  if (subtotal >= 600) {
    candidates.push({
      name: "Consectetur 50",
      discount: 50,
      message: "Ut enim ad minim veniam, quis nostrud exercitation.",
    });
  }

  if (unitPrices.length >= 3) {
    candidates.push({
      name: "Adipiscing elit %20",
      discount: subtotal * 0.2,
      message: "Duis aute irure dolor in reprehenderit voluptate.",
    });
  }

  if (unitPrices.length >= 4) {
    const sorted = [...unitPrices].sort((a, b) => a - b);
    candidates.push({
      name: "Eiusmod tempor 4/2",
      discount: sorted[0] + sorted[1],
      message: "Excepteur sint occaecat cupidatat non proident.",
    });
  }

  for (const rule of configuredRules) {
    const meetsThreshold = subtotal >= Number(rule.threshold ?? 0);
    const meetsQuantity = unitPrices.length >= Number(rule.minimumItems ?? 0);
    if (!meetsThreshold || !meetsQuantity) continue;
    let discount = 0;
    if (rule.kind === "percentage") discount = subtotal * (Number(rule.value) / 100);
    if (rule.kind === "fixed" || rule.kind === "threshold") discount = Number(rule.value);
    if (rule.kind === "quantity" && unitPrices.length > 0) {
      discount = [...unitPrices].sort((a, b) => a - b)[0] * (Number(rule.value) / 100);
    }
    candidates.push({
      name: String(rule.name),
      discount,
      message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    });
  }

  return candidates.reduce((best, item) =>
    item.discount > best.discount ? item : best,
  );
}
