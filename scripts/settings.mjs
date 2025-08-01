import {
  MODULE,
  HIDE_DISABLED,
  HIDE_PASSIVE,
  PLAYER_CLICKS,
} from "./constants.mjs";
import SettingsMenu from "./settings-menu.mjs";

const { BooleanField, NumberField } = foundry.data.fields;

export function registerSettings() {
  game.settings.register(MODULE, SettingsMenu.SETTINGS.ICON_SIZE.name, {
    scope: "client",
    config: false,
    type: new NumberField({
      initial: 50,
      integer: true,
      max: 100,
      min: 10,
      nullable: false,
      label: "VISUAL_ACTIVE_EFFECTS.SETTINGS.ICON_SIZE.NAME",
      hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.ICON_SIZE.HINT",
    }),
    requiresReload: false,
  });

  game.settings.register(MODULE, SettingsMenu.SETTINGS.FONT_SIZE.name, {
    scope: "client",
    config: false,
    type: new NumberField({
      initial: 16,
      integer: true,
      max: 50,
      min: 4,
      nullable: false,
      label: "VISUAL_ACTIVE_EFFECTS.SETTINGS.FONT_SIZE.NAME",
      hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.FONT_SIZE.HINT",
    }),
    requiresReload: false,
  });

  game.settings.register(MODULE, SettingsMenu.SETTINGS.TOP_OFFSET.name, {
    scope: "client",
    config: false,
    type: new NumberField({
      initial: 16,
      integer: true,
      max: 200,
      min: 0,
      step: 8,
      nullable: false,
      label: "VISUAL_ACTIVE_EFFECTS.SETTINGS.TOP_OFFSET.NAME",
      hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.TOP_OFFSET.HINT",
    }),
    requiresReload: false,
  });

  game.settings.register(MODULE, SettingsMenu.SETTINGS.RIGHT_OFFSET.name, {
    scope: "client",
    config: false,
    type: new NumberField({
      initial: 50,
      integer: true,
      max: 500,
      min: 0,
      step: 5,
      nullable: false,
      label: "VISUAL_ACTIVE_EFFECTS.SETTINGS.RIGHT_OFFSET.NAME",
      hint: "VISUAL_ACTIVE_EFFECTS.SETTINGS.RIGHT_OFFSET.HINT",
    }),
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

  game.settings.registerMenu(MODULE, "ui", {
    name: "VISUAL_ACTIVE_EFFECTS.SETTINGS.MENU.NAME",
    label: "VISUAL_ACTIVE_EFFECTS.SETTINGS.MENU.LABEL",
    icon: "fa-solid fa-pen-fancy",
    type: SettingsMenu,
    restricted: false,
  });
}
