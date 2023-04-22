import {
  DAYS_PER_WEEK,
  EXTRA_DAYS_PER_YEAR,
  FONT_SIZE,
  ICON_SIZE,
  MODULE,
  MONTHS_PER_YEAR,
  TOP_OFFSET,
  WEEKS_PER_MONTH
} from "./constants.mjs";
import VisualActiveEffectsEditor from "./textEditor.mjs";

// Registers the handlebar helpers
export function registerHelpers() {
  Handlebars.registerHelper("VAE.remainingTimeLabel", (effect) => {

    const SECONDS = {
      IN_ONE_ROUND: 6,
      IN_ONE_MINUTE: 60,
      IN_TWO_MINUTES: 120,
      IN_ONE_HOUR: 3600,
      IN_TWO_HOURS: 7200,
      IN_ONE_DAY: 86400,
      IN_TWO_DAYS: 172800
    }

    const daysPerWeek = game.settings.get(MODULE, DAYS_PER_WEEK) ?? 9;
    const weeksPerMonth = game.settings.get(MODULE, WEEKS_PER_MONTH) ?? 3;
    const monthsPerYear = game.settings.get(MODULE, MONTHS_PER_YEAR) ?? 12;
    const extraDaysPerYear = game.settings.get(MODULE, EXTRA_DAYS_PER_YEAR) ?? 1;

    SECONDS["IN_ONE_WEEK"] = SECONDS.IN_ONE_DAY * daysPerWeek;
    SECONDS["IN_TWO_WEEKS"] = SECONDS.IN_ONE_WEEK * 2;
    SECONDS["IN_ONE_MONTH"] = SECONDS.IN_ONE_WEEK * weeksPerMonth;
    SECONDS["IN_TWO_MONTHS"] = SECONDS.IN_ONE_MONTH * 2;
    SECONDS["IN_ONE_YEAR"] = SECONDS.IN_ONE_MONTH * monthsPerYear + SECONDS.IN_ONE_DAY * extraDaysPerYear;
    SECONDS["IN_TWO_YEARS"] = SECONDS.IN_ONE_YEAR * 2;

    const {remainingSeconds, turns} = effect;

    let string = "";
    let qty = 1;


    if (remainingSeconds == Infinity && turns) {
      if (turns == 1) string = "TURN";
      else {
        qty = turns;
        string = "TURNS";
      }
    } else if (remainingSeconds == Infinity) {
      string = "UNLIMITED";
    } else if (remainingSeconds >= SECONDS.IN_TWO_YEARS) {
      qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_YEAR);
      string = "YEARS";
    } else if (remainingSeconds >= SECONDS.IN_ONE_YEAR) {
      string = "YEAR";
    } else if (remainingSeconds >= SECONDS.IN_TWO_MONTHS) {
      qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_MONTH);
      string = "MONTHS";
    } else if (remainingSeconds >= SECONDS.IN_ONE_MONTH) {
      string = "MONTH";
    } else if (remainingSeconds >= SECONDS.IN_TWO_WEEKS) {
      qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_WEEK);
      string = "WEEKS";
    } else if (remainingSeconds >= SECONDS.IN_ONE_WEEK) {
      string = "WEEK";
    } else if (remainingSeconds >= SECONDS.IN_TWO_DAYS) {
      qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_DAY);
      string = "DAY";
    } else if (remainingSeconds >= SECONDS.IN_TWO_HOURS) {
      qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_HOUR);
      string = "HOURS";
    } else if (remainingSeconds >= SECONDS.IN_TWO_MINUTES) {
      qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_MINUTE);
      string = "MINUTES";
    } else if (remainingSeconds >= SECONDS.IN_ONE_MINUTE) {
      string = "MINUTE";
    } else if (remainingSeconds >= 2) {
      qty = remainingSeconds;
      string = "SECONDS";
    } else if (remainingSeconds === 1) {
      string = "SECOND";
    } else {
      string = "EXPIRED";
    }

    return game.i18n.format(`VISUAL_ACTIVE_EFFECTS.TIME.${string}`, {qty});
  });
}

export function _renderEditor(effect) {
  const editor = Object.values(effect.apps).find(e => e instanceof VisualActiveEffectsEditor);
  if (editor) return editor.render();
  return new VisualActiveEffectsEditor(effect, {
    title: game.i18n.format("VISUAL_ACTIVE_EFFECTS.EDITOR_TITLE", {id: effect.id})
  }).render(true);
}

/**
 * Refreshes the style sheet when a user changes the various css-related module settings.
 */
export function applyStyleSettings() {
  const iconSize = Math.max(10, Math.round(game.settings.get(MODULE, ICON_SIZE) ?? 50));
  const fontSize = Math.max(6, Math.round(game.settings.get(MODULE, FONT_SIZE) ?? 16));
  const maxWidth = Math.round(350 * fontSize / 16);
  const topOffset = Math.max(0, Math.round(game.settings.get(MODULE, TOP_OFFSET) ?? 25));

  const root = document.querySelector(":root")
  const cssSheet = Object.values(root.parentNode.styleSheets).find(s => {
    return s.href?.endsWith("styles/visual-active-effects.css");
  });
  const map = Object.values(cssSheet.rules).find(r => r.selectorText === ":root").styleMap;

  map.set(`--${MODULE}-icon-size`, iconSize + "px");
  map.set(`--${MODULE}-font-size`, fontSize + "px");
  map.set(`--${MODULE}-max-width`, maxWidth + "px");
  map.set(`--${MODULE}-top-offset`, topOffset + "px");
}
