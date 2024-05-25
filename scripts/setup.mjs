import {applyStyleSettings, registerAPI} from "./helpers.mjs";
import {registerSettings} from "./settings.mjs";
import {VisualActiveEffects} from "./visual-active-effects.mjs";

Hooks.once("init", registerSettings);
Hooks.once("ready", async function() {
  await loadTemplates([
    "modules/visual-active-effects/templates/effect.hbs"
  ]);
  registerAPI();
  applyStyleSettings();
  const panel = new VisualActiveEffects();
  await panel.render(true);
  Hooks.on("collapseSidebar", panel.handleExpand.bind(panel));
  Hooks.on("updateWorldTime", panel.refresh.bind(panel, false));
  Hooks.on("controlToken", panel.refresh.bind(panel, true));
  for (const hook of ["createActiveEffect", "updateActiveEffect", "deleteActiveEffect"]) {
    Hooks.on(hook, function(effect) {
      if (effect.target === panel.actor) panel.refresh(true);
    });
  }
  Hooks.on("updateCombat", function(combat, update, context) {
    if (context.advanceTime !== 0) return;
    if (!context.direction) return;
    panel.refresh(false);
  });
});

// Add a prompt to the effect config header.
Hooks.on("getActiveEffectConfigHeaderButtons", function(config, array) {
  array.unshift({
    class: "visual-active-effects",
    icon: "fa-solid fa-pen-fancy",
    onclick: async () => {
      const content = HandlebarsHelpers.formGroup(new foundry.data.fields.NumberField({
        choices: {
          0: "VISUAL_ACTIVE_EFFECTS.Inclusion.Default",
          1: "VISUAL_ACTIVE_EFFECTS.Inclusion.Include",
          "-1": "VISUAL_ACTIVE_EFFECTS.Inclusion.Exclude"
        },
        initial: 0,
        label: "VISUAL_ACTIVE_EFFECTS.Inclusion.Label",
        hint: "VISUAL_ACTIVE_EFFECTS.Inclusion.Hint"
      }), {hash: {
        name: "inclusion",
        localize: true,
        sort: false,
        blank: false,
        value: config.document.flags["visual-active-effects"]?.data?.inclusion ?? 0
      }});
      const value = await foundry.applications.api.DialogV2.prompt({
        content: content,
        rejectClose: false,
        modal: true,
        window: {
          icon: "fa-solid fa-pen-fancy",
          title: game.i18n.format("VISUAL_ACTIVE_EFFECTS.Inclusion.Title", {name: config.document.name})
        },
        position: {
          width: 300
        },
        ok: {
          icon: "fa-solid fa-pen-fancy",
          label: "Confirm",
          callback: (e, b, d) => b.form.elements.inclusion.value
        }
      });
      if (Number.isNumeric(value)) config.document.setFlag("visual-active-effects", "data.inclusion", parseInt(value));
    }
  });
});
