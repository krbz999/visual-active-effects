import {ICON, MODULE} from "./scripts/constants.mjs";
import {registerHelpers, _renderEditor, applyStyleSettings} from "./scripts/helpers.mjs";
import {registerSettings} from "./scripts/settings.mjs";
import {VisualActiveEffects} from "./scripts/visual-active-effects.mjs";

Hooks.once("init", () => console.log("ZHELL | Initializing Visual Active Effects"));
Hooks.once("setup", registerSettings);
Hooks.once("ready", async function() {
  registerHelpers();
  applyStyleSettings();
  const panel = new VisualActiveEffects();
  await panel.render(true);
  Hooks.on("collapseSidebar", panel.handleExpand.bind(panel));
  Hooks.on("updateWorldTime", () => panel.refresh(false));
  Hooks.on("controlToken", () => panel.refresh(true));
  for (const hook of ["createActiveEffect", "updateActiveEffect", "deleteActiveEffect"]) {
    Hooks.on(hook, function(effect) {
      if (effect.parent === panel.actor) panel.refresh(true);
    });
  }
});
Hooks.on("getActiveEffectConfigHeaderButtons", function(app, array) {
  array.unshift({
    class: MODULE,
    icon: ICON,
    onclick: () => _renderEditor(app.object)
  });
});
