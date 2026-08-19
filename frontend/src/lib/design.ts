/** Design tokens centralizados — Orbita */
export const D = {
  bg:       "#000000",
  bg2:      "#0a0a0a",
  surface:  "#111111",
  surface2: "#18181b",
  border:   "#27272a",
  border2:  "#3f3f46",
  muted:    "#71717a",
  muted2:   "#52525b",
  text:     "#fafafa",
  text2:    "#e4e4e7",
  text3:    "#a1a1aa",
  accent:   "#f97316",
  accent2:  "#ea6c10",
  success:  "#22c55e",
  error:    "#ef4444",
  warning:  "#eab308",
  info:     "#3b82f6",
} as const;

/** Input base style */
export const inputStyle = {
  background: D.surface,
  border: `1px solid ${D.border}`,
  color: D.text,
};

/** Card base style */
export const cardStyle = {
  background: D.surface,
  border: `1px solid ${D.border}`,
  borderRadius: "10px",
};

/** Button primary */
export const btnPrimary = {
  background: D.accent,
  color: "#fff",
};

/** Accent glow (sutil) */
export const accentGlow = "0 0 0 1px rgba(249,115,22,0.15), 0 4px 12px rgba(249,115,22,0.1)";
