import { ICON_SIZE, MODULE } from "./scripts/constants.mjs";
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
    "controlToken", "preUpdateToken"
  ]) {
    Hooks.on(hook, () => panel.refresh());
  }

  collapsibleSetup();

  const pixels = game.settings.get(MODULE, ICON_SIZE) ?? 50;
  const property = "--visual-active-effects-icon-size";
  document.documentElement.style.setProperty(property, `${pixels}px`);
});
