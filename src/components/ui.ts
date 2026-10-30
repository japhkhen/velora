export function btn(variant: "solid" | "line" | "wine" = "solid", extra = "") {
  const base =
    "inline-flex items-center justify-center px-5 py-3 text-sm tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50";
  const map = {
    solid: "bg-ink text-ivory hover:bg-wine",
    line: "border border-ink bg-transparent text-ink hover:bg-ink hover:text-ivory",
    wine: "bg-wine text-ivory hover:bg-[#541824]",
  };
  return `${base} ${map[variant]} ${extra}`;
}

export const fieldClass =
  "w-full border border-line bg-paper px-3 py-3 text-sm text-ink outline-none transition focus:border-ink";

export const labelClass = "mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted";
