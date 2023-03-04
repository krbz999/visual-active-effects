import {FONT_SIZE, ICON, ICON_SIZE, MODULE, TOP_OFFSET} from "./scripts/constants.mjs";
import {registerHelpers, _renderEditor} from "./scripts/helpers.mjs";
import {registerSettings} from "./scripts/settings.mjs";
import {VisualActiveEffects} from "./scripts/visual-active-effects.mjs";

Hooks.once("init", () => {
  console.log("ZHELL | Initializing Visual Active Effects");
});

Hooks.once("setup", registerSettings);

Hooks.once("ready", async function() {
  registerHelpers();
  const panel = new VisualActiveEffects();
  await panel.render(true);
  Hooks.on("collapseSidebar", panel.handleExpand.bind(panel));

  Hooks.on("updateWorldTime", () => panel.refresh());
  Hooks.on("controlToken", () => panel.refresh());
  for (const hook of ["createActiveEffect", "updateActiveEffect", "deleteActiveEffect"]) {
    Hooks.on(hook, function(effect) {
      if (effect.parent === panel.actor) panel.refresh();
    });
  }

  const iconSize = Math.max(10, Math.round(game.settings.get(MODULE, ICON_SIZE) ?? 50));
  const iconProperty = "--visual-active-effects-icon-size";
  document.documentElement.style.setProperty(iconProperty, `${iconSize}px`);

  const fontSize = Math.max(6, Math.round(game.settings.get(MODULE, FONT_SIZE) ?? 16));
  const fontProperty = "--visual-active-effects-font-size";
  document.documentElement.style.setProperty(fontProperty, `${fontSize}px`);

  const maxWidth = Math.round(350 * fontSize / 16);
  const widthProperty = "--visual-active-effects-max-width";
  document.documentElement.style.setProperty(widthProperty, `${maxWidth}px`);

  const topOffset = Math.max(0, Math.round(game.settings.get(MODULE, TOP_OFFSET) ?? 25));
  const topOffsetProperty = "--visual-active-effects-top-offset";
  document.documentElement.style.setProperty(topOffsetProperty, `${topOffset}px`);
});

Hooks.on("getActiveEffectConfigHeaderButtons", function(app, array) {
  array.unshift({
    class: MODULE,
    icon: ICON,
    onclick: () => _renderEditor(app.object)
  });
});
