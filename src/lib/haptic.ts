/**
 * Cross-platform haptic feedback helper.
 * Uses the Vibration API where available (Android, some browsers).
 * Silent no-op on unsupported platforms (iOS Safari, desktop).
 */
export function haptic(pattern: number | number[] = 10): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

// Preset patterns — defined as plain objects (not readonly) for VibratePattern compat
export const HAPTIC = {
  tap:     10              as number,
  light:   [8, 20, 8]     as number[],
  success: [15, 40, 15, 40, 60] as number[],
  error:   [80, 30, 80]   as number[],
};
