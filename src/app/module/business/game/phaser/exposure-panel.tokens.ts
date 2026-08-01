export type ExposurePanelMode =
  | "desktop"
  | "tablet"
  | "mobile-portrait"
  | "mobile-landscape";

export function exposureLipRatio(mode: ExposurePanelMode): number {
  if (mode === "mobile-portrait") return 0.10;
  if (mode === "mobile-landscape") return 0.10;
  if (mode === "tablet") return 0.13;

  return 0.14;
}

export function exposureNameStripRatio(mode: ExposurePanelMode): number {
  /**
   * Desktop currently looks good with 0.225.
   * Mobile needs smaller strip so the exposure tile area is not consumed.
   */
  // Reserve a little more strip width/height around the rotated player name.
  // The layout engine compensates panel thickness, so the exposed-tile area
  // remains rack-tile sized.
  if (mode === "mobile-portrait") return 0.18;
  if (mode === "mobile-landscape") return 0.18;
  if (mode === "tablet") return 0.17;

  return 0.225;
}

export function horizontalLabelCenterRatio(mode: ExposurePanelMode): number {
  const strip = exposureNameStripRatio(mode);
  return 1 - strip / 2;
}

export function leftLabelCenterRatio(mode: ExposurePanelMode): number {
  const strip = exposureNameStripRatio(mode);
  return 1 - strip / 2;
}

export function rightLabelCenterRatio(mode: ExposurePanelMode): number {
  const strip = exposureNameStripRatio(mode);
  return strip / 2;
}
