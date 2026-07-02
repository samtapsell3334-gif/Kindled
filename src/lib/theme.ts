/**
 * v8.2 colour-system switch. THE founder flip lives here: change
 * DEFAULT_THEME to "ember-teal" to make Direction 2 the site default;
 * change it back for the one-line revert. Preview either theme on any URL
 * with ?theme=ember-teal / ?theme=legacy (persists for the browsing session).
 *
 * Server-rendered artwork (OG/share cards) cannot read data-theme, so the
 * night-canvas constants below follow DEFAULT_THEME and flip with it.
 */

export type ThemeName = "legacy" | "ember-teal";

export const DEFAULT_THEME: ThemeName = "legacy";

const NIGHT: Record<ThemeName, { canvas: string; ink: string }> = {
  legacy: { canvas: "#0f172a", ink: "#FAF5EE" },
  "ember-teal": { canvas: "#04342C", ink: "#E1F5EE" },
};

/** Night set-piece canvas (reveal, OG/share cards, film end-cards). */
export const NIGHT_CANVAS = NIGHT[DEFAULT_THEME].canvas;
/** Cream text on the night canvas. */
export const NIGHT_INK = NIGHT[DEFAULT_THEME].ink;
