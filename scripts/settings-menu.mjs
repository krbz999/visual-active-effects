import { MODULE } from "./constants.mjs";

const { HandlebarsApplicationMixin, Application } = foundry.applications.api;

export default class SettingsMenu extends HandlebarsApplicationMixin(Application) {
  /**
   * Metadata for the ui settings.
   * @type {object}
   */
  static SETTINGS = foundry.utils.deepFreeze({
    FONT_SIZE: {
      name: "fontSize",
      css: "font-size",
      default: 16,
      min: 6,
    },
    ICON_SIZE: {
      name: "iconSize",
      css: "icon-size",
      default: 50,
      min: 10,
    },
    TOP_OFFSET: {
      name: "topOffset",
      css: "top-offset",
      default: 16,
      min: 0,
    },
  });

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    tag: "form",
    position: {
      width: 500,
    },
    window: {
      title: "VISUAL_ACTIVE_EFFECTS.SETTINGS.MENU.TITLE",
      icon: "fa-solid fa-pen-fancy",
      contentClasses: ["standard-form"],
    },
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: SettingsMenu.#onSubmit,
    },
    actions: {
      reset: SettingsMenu.#onReset,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    inputs: {
      template: "modules/visual-active-effects/templates/settings/inputs.hbs",
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = {};

    for (const { name } of Object.values(SettingsMenu.SETTINGS)) {
      const field = game.settings.settings.get(`${MODULE}.${name}`).type;
      context[name] = {
        field, name,
        value: game.settings.get(MODULE, name),
      };
    }

    context.buttons = [{
      type: "submit",
      icon: "fa-solid fa-check",
      label: "Confirm",
    }, {
      type: "button",
      icon: "fa-solid fa-recycle",
      label: "Reset",
      action: "reset",
    }];

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onRender(context, options) {
    super._onRender(context, options);

    for (const element of this.element.querySelectorAll("range-picker input")) {
      element.addEventListener("input", SettingsMenu.#onChangeRange.bind(this));
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onClose(options) {
    super._onClose(options);
    SettingsMenu.applyDefaults();
  }

  /* -------------------------------------------------- */

  /**
   * Apply the UI configurations in the settings.
   */
  static applyDefaults() {
    SettingsMenu.applyStyles({
      iconSize: game.settings.get(MODULE, SettingsMenu.SETTINGS.ICON_SIZE.name),
      fontSize: game.settings.get(MODULE, SettingsMenu.SETTINGS.FONT_SIZE.name),
      topOffset: game.settings.get(MODULE, SettingsMenu.SETTINGS.TOP_OFFSET.name),
    });
  }

  /* -------------------------------------------------- */

  /**
   * Update the UI on change or input events.
   * @this {SettingsMenu}
   * @param {ChangeEvent|InputEvent} event    The initiating change or input event.
   */
  static #onChangeRange(event) {
    const target = event.currentTarget;
    const range = target.closest("range-picker");
    SettingsMenu.applyStyles({ [range.name]: target.valueAsNumber });
  }

  /* -------------------------------------------------- */

  /**
   * Apply the styles to the UI. If values are not provided, stored settings are used.
   * @param {object} [config]                     Style configuration.
   * @param {number|string} [config.iconSize]     The desired icon size.
   * @param {number|string} [config.fontSize]     The desired font size.
   * @param {number|string} [config.topOffset]    The desired top offset.
   */
  static applyStyles({ iconSize, fontSize, topOffset } = {}) {
    const style = document.querySelector(":root").style;

    if (Number.isInteger(iconSize)) {
      iconSize = Math.max(
        SettingsMenu.SETTINGS.ICON_SIZE.min,
        Number.isInteger(iconSize)
          ? Number(iconSize)
          : game.settings.get(MODULE, SettingsMenu.SETTINGS.ICON_SIZE.name)
            || SettingsMenu.SETTINGS.ICON_SIZE.default,
      );
      style.setProperty(`--${MODULE}-${SettingsMenu.SETTINGS.ICON_SIZE.css}`, iconSize + "px");
    }

    if (Number.isInteger(fontSize)) {
      fontSize = Math.max(
        SettingsMenu.SETTINGS.FONT_SIZE.min,
        Number.isInteger(fontSize)
          ? Number(fontSize)
          : game.settings.get(MODULE, SettingsMenu.SETTINGS.FONT_SIZE.name)
            || SettingsMenu.SETTINGS.FONT_SIZE.default,
      );
      style.setProperty(`--${MODULE}-${SettingsMenu.SETTINGS.FONT_SIZE.css}`, fontSize + "px");

      const maxWidth = Math.round(300 * fontSize / 16) + "px";
      style.setProperty(`--${MODULE}-max-width`, maxWidth);
    }

    if (Number.isInteger(topOffset)) {
      topOffset = Math.max(
        SettingsMenu.SETTINGS.TOP_OFFSET.min,
        Number.isInteger(topOffset)
          ? Number(topOffset)
          : game.settings.get(MODULE, SettingsMenu.SETTINGS.TOP_OFFSET.name)
            || SettingsMenu.SETTINGS.TOP_OFFSET.default,
      );
      style.setProperty(`--${MODULE}-${SettingsMenu.SETTINGS.TOP_OFFSET.css}`, topOffset + "px");
    }
  }

  /* -------------------------------------------------- */

  /**
   * Handle submission.
   * @this {SettingsMenu}
   * @param {SubmitEvent} event           The initiating submit event.
   * @param {HTMLElement} form            The form element.
   * @param {FormDataExtended} formData   The form data.
   */
  static async #onSubmit(event, form, formData) {
    formData = { ...formData.object };
    for (const [k, v] of Object.entries(formData)) {
      await game.settings.set(MODULE, k, v);
    }
  }

  /* -------------------------------------------------- */

  /**
   * @this {SettingsMenu}
   * @param {PointerEvent} event          The initiating click event.
   * @param {HTMLButtonElement} target    The button that defined the [data-action].
   */
  static async #onReset(event, target) {
    for (const [k, v] of Object.entries(SettingsMenu.SETTINGS)) {
      await game.settings.set(MODULE, v.name, v.default);
    }
    SettingsMenu.applyDefaults();
    this.render();
  }
}
