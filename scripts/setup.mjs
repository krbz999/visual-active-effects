import { MODULE } from "./constants.mjs";
import { registerAPI } from "./helpers.mjs";
import { registerSettings } from "./settings.mjs";
import VisualActiveEffects from "./visual-active-effects.mjs";
import SettingsMenu from "./settings-menu.mjs";

foundry.helpers.Hooks.once("init", () => {
  registerSettings();
  CONFIG.ui.visualActiveEffects = VisualActiveEffects;
});

foundry.helpers.Hooks.once("ready", function() {
  registerAPI();
  SettingsMenu.applyDefaults();
  ui.visualActiveEffects.render({ force: true });
});

foundry.helpers.Hooks.on("updateWorldTime", () => ui.visualActiveEffects.render());
foundry.helpers.Hooks.on("controlToken", () => ui.visualActiveEffects.render());

/* -------------------------------------------------- */

for (const prefix of ["create", "update", "delete"]) {
  for (const documentName of ["ActiveEffect", "Item"]) {
    foundry.helpers.Hooks.on(`${prefix}${documentName}`, function(document) {
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
      if (actor && (actor.uuid === ui.visualActiveEffects.actor?.uuid)) {
        ui.visualActiveEffects.render();
      }
    });
  }
}

/* -------------------------------------------------- */

foundry.helpers.Hooks.on("updateCombat", function(combat, update, context) {
  if (!context.direction) return;
  ui.visualActiveEffects.render();
});

/* -------------------------------------------------- */

foundry.helpers.Hooks.on("getHeaderControlsActiveEffectConfig", function(config, array) {
  const icon = "fa-solid fa-fw fa-pen-fancy";

  const onClick = () => {
    const input = foundry.applications.fields.createSelectInput({
      name: "inclusion",
      sort: false,
      required: true,
      value: config.document.getFlag(MODULE, "data.inclusion"),
      initial: 0,
      localize: true,
      options: [
        { value: 0, label: "VISUAL_ACTIVE_EFFECTS.Inclusion.Default" },
        { value: 1, label: "VISUAL_ACTIVE_EFFECTS.Inclusion.Include" },
        { value: -1, label: "VISUAL_ACTIVE_EFFECTS.Inclusion.Exclude" },
      ],
    });

    const formGroup = foundry.applications.fields.createFormGroup({
      input: input,
      label: "VISUAL_ACTIVE_EFFECTS.Inclusion.Label",
      hint: "VISUAL_ACTIVE_EFFECTS.Inclusion.Hint",
      localize: true,
    });

    foundry.applications.api.Dialog.prompt({
      content: `<fieldset>${formGroup.outerHTML}</fieldset>`,
      window: {
        icon: icon,
        title: game.i18n.format("VISUAL_ACTIVE_EFFECTS.Inclusion.Title", { name: config.document.name }),
      },
      position: {
        width: 400,
        height: "auto",
      },
      ok: {
        icon: icon,
        label: "Confirm",
        callback: (event, button) => {
          const value = button.form.elements.inclusion.value;
          config.document.setFlag(MODULE, "data.inclusion", Number(value));
        },
      },
    });
  };

  array.push({
    icon, onClick,
    action: "visual-active-effects.configureInclusion",
    label: "VAE: Configure",
    visible: () => config.document.isOwner,
  });
});
