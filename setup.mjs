import { FONT_SIZE, ICON, ICON_SIZE, MODULE } from "./scripts/constants.mjs";
import { collapsibleSetup, registerHelpers } from "./scripts/helpers.mjs";
import { registerSettings } from "./scripts/settings.mjs";
import VisualActiveEffectsEditor from "./scripts/textEditor.mjs";
import { VisualEffects } from "./scripts/visual-active-effects.mjs";

Hooks.once("init", () => {
  console.log("ZHELL | Initializing Visual Active Effects");
});

Hooks.once("setup", registerSettings);

Hooks.once("ready", async function() {
  registerHelpers();
  const panel = new VisualEffects();
  await panel.render(true);
  Hooks.on("collapseSidebar", panel.handleExpand.bind(panel));

  for (const hook of [
    "updateWorldTime", "createActiveEffect",
    "updateActiveEffect", "deleteActiveEffect",
    "controlToken"
  ]) {
    Hooks.on(hook, () => panel.refresh());
  }

  collapsibleSetup();

  const iconSize = Math.round(game.settings.get(MODULE, ICON_SIZE) ?? 50);
  const iconProperty = "--visual-active-effects-icon-size";
  document.documentElement.style.setProperty(iconProperty, `${iconSize}px`);

  const fontSize = Math.round(game.settings.get(MODULE, FONT_SIZE) ?? 16);
  const fontProperty = "--visual-active-effects-font-size";
  document.documentElement.style.setProperty(fontProperty, `${fontSize}px`);

  const maxWidth = Math.round(350 * fontSize / 16);
  const widthProperty = "--visual-active-effects-max-width";
  document.documentElement.style.setProperty(widthProperty, `${maxWidth}px`);
});

Hooks.on("getActiveEffectConfigHeaderButtons", function(app, array) {
  array.unshift({
    class: MODULE,
    icon: ICON,
    onclick: async () => new VisualActiveEffectsEditor(app.object, {
      title: game.i18n.format("VISUAL_ACTIVE_EFFECTS.EDITOR_TITLE", { id: app.object.id })
    }).render(true)
  });
});
