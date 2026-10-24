export const PHOTO_WIDTHS = [320, 640, 960, 1280] as const;
export const HERO_WIDTHS = [640, 960, 1280, 1920] as const;
export function imageWidths(src: string, nativeWidth: number): number[] {
  const widths = /logo/i.test(src)
    ? [64, 128, 256]
    : src.split("/").slice(1, 3).join("/") === "img/home"
      ? HERO_WIDTHS
      : PHOTO_WIDTHS;
  return [...new Set(widths.map((w) => Math.min(w, nativeWidth)))];
}
