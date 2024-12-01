import {MODULE} from "./constants.mjs";
import {applyStyleSettings, registerAPI} from "./helpers.mjs";
import {registerSettings} from "./settings.mjs";
import VisualActiveEffects from "./visual-active-effects.mjs";

let panel;

/* -------------------------------------------------- */

Hooks.once("init", registerSettings);

/* -------------------------------------------------- */

Hooks.once("ready", function() {
  loadTemplates([`modules/${MODULE}/templates/effect.hbs`]);
});

/* -------------------------------------------------- */

Hooks.once("ready", function() {
  registerAPI();
  applyStyleSettings();
  panel = new VisualActiveEffects();
  panel.render({force: true});

  Hooks.on("updateWorldTime", () => panel.render());
  Hooks.on("controlToken", () => panel.render({force: true}));
});

/* -------------------------------------------------- */

for (const prefix of ["create", "update", "delete"]) {
  for (const documentName of ["ActiveEffect", "Item"]) {
    Hooks.on(`${prefix}${documentName}`, function(document) {
      let actor;
      switch (document.documentName) {
        case "Item":
          actor = document.parent;
          break;
        case "ActiveEffect":
          actor = document.parent;
          if (actor?.documentName === "Item") actor = actor.parent;
          break;
      }
      if (actor && (actor.uuid === panel.actor?.uuid)) panel.render({force: true});
    });
  }
}

/* -------------------------------------------------- */

Hooks.on("updateCombat", function(combat, update, context) {
  if (context.advanceTime !== 0) return;
  if (!context.direction) return;
  panel.refresh(false);
});

/* -------------------------------------------------- */

Hooks.on("getActiveEffectConfigHeaderButtons", function(config, array) {
  const icon = "fa-solid fa-pen-fancy";

  array.unshift({
    class: MODULE,
    icon: icon,
    onclick: () => {
      const input = foundry.applications.fields.createSelectInput({
        name: "inclusion",
        sort: false,
        required: true,
        value: config.document.getFlag(MODULE, "data.inclusion"),
        initial: 0,
        localize: true,
        options: [
          {value: 0, label: "VISUAL_ACTIVE_EFFECTS.Inclusion.Default"},
          {value: 1, label: "VISUAL_ACTIVE_EFFECTS.Inclusion.Include"},
          {value: -1, label: "VISUAL_ACTIVE_EFFECTS.Inclusion.Exclude"}
        ]
      });

      const formGroup = foundry.applications.fields.createFormGroup({
        input: input,
        label: "VISUAL_ACTIVE_EFFECTS.Inclusion.Label",
        hint: "VISUAL_ACTIVE_EFFECTS.Inclusion.Hint",
        localize: true
      });

      foundry.applications.api.DialogV2.prompt({
        content: `<fieldset>${formGroup.outerHTML}</fieldset>`,
        rejectClose: false,
        modal: true,
        window: {
          icon: icon,
          title: game.i18n.format("VISUAL_ACTIVE_EFFECTS.Inclusion.Title", {name: config.document.name})
        },
        position: {
          width: 300,
          height: "auto"
        },
        ok: {
          icon: icon,
          label: "Confirm",
          callback: (event, button) => {
            const value = button.form.elements.inclusion.value;
            config.document.setFlag(MODULE, "data.inclusion", Number(value));
          }
        }
      });
    }
  });
});
