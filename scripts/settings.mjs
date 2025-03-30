import {
  ICON_SIZE,
  MODULE,
  HIDE_DISABLED,
  HIDE_PASSIVE,
  FONT_SIZE,
  TOP_OFFSET,
  PLAYER_CLICKS,
} from "./constants.mjs";
import { applyStyleSettings } from "./helpers.mjs";

const { BooleanField, NumberField } = foundry.data.fields;

export function registerSettings() {
  game.settings.register(MODULE, ICON_SIZE, {
    name: "VISUAL_ACTIVE_EFFECTS.SETTINGS.ICON_SIZE.NAME",
    hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.ICON_SIZE.HINT",
    scope: "client",
    config: true,
    type: new NumberField({
      initial: 50,
      integer: true,
      max: 100,
      min: 10,
      nullable: false,
    }),
    requiresReload: false,
    onChange: applyStyleSettings,
  });

  game.settings.register(MODULE, FONT_SIZE, {
    name: "VISUAL_ACTIVE_EFFECTS.SETTINGS.FONT_SIZE.NAME",
    hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.FONT_SIZE.HINT",
    scope: "client",
    config: true,
    type: new NumberField({
      initial: 16,
      integer: true,
      max: 50,
      min: 4,
      nullable: false,
    }),
    requiresReload: false,
    onChange: applyStyleSettings,
  });

  game.settings.register(MODULE, TOP_OFFSET, {
    name: "VISUAL_ACTIVE_EFFECTS.SETTINGS.TOP_OFFSET.NAME",
    hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.TOP_OFFSET.HINT",
    scope: "client",
    config: true,
    type: new NumberField({
      initial: 16,
      integer: true,
      max: 200,
      min: 0,
      nullable: false,
    }),
    requiresReload: false,
    onChange: applyStyleSettings,
  });

  game.settings.register(MODULE, HIDE_DISABLED, {
    name: "VISUAL_ACTIVE_EFFECTS.SETTINGS.HIDE_DISABLED.NAME",
    hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.HIDE_DISABLED.HINT",
    scope: "world",
    config: true,
    type: new BooleanField(),
    requiresReload: true,
  });

  game.settings.register(MODULE, HIDE_PASSIVE, {
    name: "VISUAL_ACTIVE_EFFECTS.SETTINGS.HIDE_PASSIVE.NAME",
    hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.HIDE_PASSIVE.HINT",
    scope: "world",
    config: true,
    type: new BooleanField({ initial: true }),
    requiresReload: true,
  });

  game.settings.register(MODULE, PLAYER_CLICKS, {
    name: "VISUAL_ACTIVE_EFFECTS.SETTINGS.PLAYER_CLICKS.NAME",
    hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.PLAYER_CLICKS.HINT",
    scope: "world",
    config: true,
    type: new BooleanField({ initial: true }),
    requiresReload: true,
  });
}
