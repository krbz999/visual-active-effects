import {
  DAYS_PER_WEEK,
  EXTRA_DAYS_PER_YEAR,
  ICON_SIZE,
  MODULE,
  MONTHS_PER_YEAR,
  WEEKS_PER_MONTH,
  HIDE_DISABLED
} from "./constants.mjs";

export function registerSettings() {
  game.settings.register(MODULE, ICON_SIZE, {
    name: game.i18n.localize("VISUAL_ACTIVE_EFFECTS.SETTINGS.ICON_SIZE.NAME"),
    hint: game.i18n.localize("VISUAL_ACTIVE_EFFECTS.SETTINGS.ICON_SIZE.HINT"),
    scope: "world",
    config: true,
    type: Number,
    default: 50,
    requiresReload: true
  });

  game.settings.register(MODULE, HIDE_DISABLED, {
    name: game.i18n.localize("VISUAL_ACTIVE_EFFECTS.SETTINGS.HIDE_DISABLED.NAME"),
    hint: game.i18n.localize("VISUAL_ACTIVE_EFFECTS.SETTINGS.HIDE_DISABLED.HINT"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true
  });

  game.settings.register(MODULE, DAYS_PER_WEEK, {
    name: game.i18n.localize("VISUAL_ACTIVE_EFFECTS.SETTINGS.DAYS_PER_WEEK.NAME"),
    hint: game.i18n.localize("VISUAL_ACTIVE_EFFECTS.SETTINGS.DAYS_PER_WEEK.HINT"),
    scope: "world",
    config: true,
    type: Number,
    default: 9,
    requiresReload: true
  });

  game.settings.register(MODULE, WEEKS_PER_MONTH, {
    name: game.i18n.localize("VISUAL_ACTIVE_EFFECTS.SETTINGS.WEEKS_PER_MONTH.NAME"),
    hint: game.i18n.localize("VISUAL_ACTIVE_EFFECTS.SETTINGS.WEEKS_PER_MONTH.HINT"),
    scope: "world",
    config: true,
    type: Number,
    default: 3,
    requiresReload: true
  });

  game.settings.register(MODULE, MONTHS_PER_YEAR, {
    name: game.i18n.localize("VISUAL_ACTIVE_EFFECTS.SETTINGS.MONTHS_PER_YEAR.NAME"),
    hint: game.i18n.localize("VISUAL_ACTIVE_EFFECTS.SETTINGS.MONTHS_PER_YEAR.HINT"),
    scope: "world",
    config: true,
    type: Number,
    default: 12,
    requiresReload: true
  });

  game.settings.register(MODULE, EXTRA_DAYS_PER_YEAR, {
    name: game.i18n.localize("VISUAL_ACTIVE_EFFECTS.SETTINGS.EXTRA_DAYS_PER_YEAR.NAME"),
    hint: game.i18n.localize("VISUAL_ACTIVE_EFFECTS.SETTINGS.EXTRA_DAYS_PER_YEAR.HINT"),
    scope: "world",
    config: true,
    type: Number,
    default: 1,
    requiresReload: true
  });
}
