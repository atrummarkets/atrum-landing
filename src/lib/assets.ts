/**
 * Swaps a scene asset for its mobile variant.
 *
 * The desktop/full-tier art stays exactly as authored — every `*-mobile.webp`
 * is the same native resolution, just re-encoded, so this only ever changes
 * bytes-on-the-wire, never what's on screen. Gated on the viewport's own
 * `mobile` flag (not render tier) so a weak desktop that lands on "standard"
 * tier still gets the original files; only genuinely narrow/phone viewports
 * see the swap.
 */
export function mobileAsset(path: string, mobile: boolean): string {
  if (!mobile) return path;
  const dot = path.lastIndexOf(".");
  return `${path.slice(0, dot)}-mobile.webp`;
}
