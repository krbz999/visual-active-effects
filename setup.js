import { FONT_SIZE, ICON_SIZE, MODULE } from "./scripts/constants.mjs";
import { collapsibleSetup, registerHelpers } from "./scripts/helpers.mjs";
import { registerSettings } from "./scripts/settings.mjs";
import { VisualEffects } from "./scripts/visual-active-effects.mjs";

Hooks.once("init", () => {
  console.log("ZHELL | Initializing Visual Active Effects");
});

Hooks.once("setup", registerSettings);

Hooks.once("ready", async function () {
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

  const iconSize = game.settings.get(MODULE, ICON_SIZE) ?? 50;
  const iconProperty = "--visual-active-effects-icon-size";
  document.documentElement.style.setProperty(iconProperty, `${iconSize}px`);

  const fontSize = game.settings.get(MODULE, FONT_SIZE) ?? 16;
  const fontProperty = "--visual-active-effects-font-size";
  document.documentElement.style.setProperty(fontProperty, `${fontSize}px`);
});
