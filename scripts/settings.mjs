import {
  DAYS_PER_WEEK,
  EXTRA_DAYS_PER_YEAR,
  ICON_SIZE,
  MODULE,
  MONTHS_PER_YEAR,
  WEEKS_PER_MONTH,
  HIDE_DISABLED,
  HIDE_PASSIVE,
  FONT_SIZE,
  TOP_OFFSET,
  PLAYER_CLICKS
} from "./constants.mjs";
import {applyStyleSettings} from "./helpers.mjs";

export function registerSettings() {
  game.settings.register(MODULE, ICON_SIZE, {
    name: "VISUAL_ACTIVE_EFFECTS.SETTINGS.ICON_SIZE.NAME",
    hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.ICON_SIZE.HINT",
    scope: "client",
    config: true,
    type: Number,
    default: 50,
    requiresReload: false,
    onChange: applyStyleSettings
  });

  game.settings.register(MODULE, FONT_SIZE, {
    name: "VISUAL_ACTIVE_EFFECTS.SETTINGS.FONT_SIZE.NAME",
    hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.FONT_SIZE.HINT",
    scope: "client",
    config: true,
    type: Number,
    default: 16,
    requiresReload: false,
    onChange: applyStyleSettings
  });

  game.settings.register(MODULE, TOP_OFFSET, {
    name: "VISUAL_ACTIVE_EFFECTS.SETTINGS.TOP_OFFSET.NAME",
    hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.TOP_OFFSET.HINT",
    scope: "client",
    config: true,
    type: Number,
    default: 25,
    requiresReload: false,
    onChange: applyStyleSettings
  });

  game.settings.register(MODULE, HIDE_DISABLED, {
    name: "VISUAL_ACTIVE_EFFECTS.SETTINGS.HIDE_DISABLED.NAME",
    hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.HIDE_DISABLED.HINT",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true
  });

  game.settings.register(MODULE, HIDE_PASSIVE, {
    name: "VISUAL_ACTIVE_EFFECTS.SETTINGS.HIDE_PASSIVE.NAME",
    hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.HIDE_PASSIVE.HINT",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  game.settings.register(MODULE, PLAYER_CLICKS, {
    name: "VISUAL_ACTIVE_EFFECTS.SETTINGS.PLAYER_CLICKS.NAME",
    hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.PLAYER_CLICKS.HINT",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  game.settings.register(MODULE, DAYS_PER_WEEK, {
    name: "VISUAL_ACTIVE_EFFECTS.SETTINGS.DAYS_PER_WEEK.NAME",
    hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.DAYS_PER_WEEK.HINT",
    scope: "world",
    config: true,
    type: Number,
    default: 9,
    requiresReload: true
  });

  game.settings.register(MODULE, WEEKS_PER_MONTH, {
    name: "VISUAL_ACTIVE_EFFECTS.SETTINGS.WEEKS_PER_MONTH.NAME",
    hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.WEEKS_PER_MONTH.HINT",
    scope: "world",
    config: true,
    type: Number,
    default: 3,
    requiresReload: true
  });

  game.settings.register(MODULE, MONTHS_PER_YEAR, {
    name: "VISUAL_ACTIVE_EFFECTS.SETTINGS.MONTHS_PER_YEAR.NAME",
    hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.MONTHS_PER_YEAR.HINT",
    scope: "world",
    config: true,
    type: Number,
    default: 12,
    requiresReload: true
  });

  game.settings.register(MODULE, EXTRA_DAYS_PER_YEAR, {
    name: "VISUAL_ACTIVE_EFFECTS.SETTINGS.EXTRA_DAYS_PER_YEAR.NAME",
    hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.EXTRA_DAYS_PER_YEAR.HINT",
    scope: "world",
    config: true,
    type: Number,
    default: 1,
    requiresReload: true
  });
}
