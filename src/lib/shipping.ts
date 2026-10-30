export const REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Central",
  "Eastern",
  "Western",
  "Western North",
  "Volta",
  "Oti",
  "Northern",
  "North East",
  "Savannah",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
] as const;

export type Region = (typeof REGIONS)[number];

export const FREE_ACCRA_OVER = 500;
export const ACCRA_SHIPPING = 25;
export const OTHER_SHIPPING = 45;

export function shippingFee(region: string, subtotal: number) {
  if (region === "Greater Accra" && subtotal >= FREE_ACCRA_OVER) return 0;
  if (region === "Greater Accra") return ACCRA_SHIPPING;
  return OTHER_SHIPPING;
}
