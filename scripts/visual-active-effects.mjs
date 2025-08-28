import { HIDE_DISABLED, HIDE_PASSIVE, MODULE, PLAYER_CLICKS } from "./constants.mjs";

const { HandlebarsApplicationMixin, Application } = foundry.applications.api;

export default class VisualActiveEffects extends HandlebarsApplicationMixin(Application) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actions: {
      deleteEffect: {
        handler: VisualActiveEffects.#deleteEffect,
        buttons: [2],
      },
    },
    classes: [MODULE, "panel", "themed", "theme-light"],
    id: MODULE,
    window: {
      frame: false,
      minimizable: false,
      positioned: false,
      resizable: false,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    main: {
      template: `modules/${MODULE}/templates/${MODULE}.hbs`,
      templates: [
        `modules/${MODULE}/templates/effect.hbs`,
        `modules/${MODULE}/templates/tooltip.hbs`,
      ],
      root: true,
    },
  };

  /* -------------------------------------------------- */

  /**
   * Array of buttons for other modules.
   * @type {object[]}
   */
  buttons = [];

  /* -------------------------------------------------- */

  /**
   * The currently selected token's actor, otherwise the user's assigned actor.
   * @type {foundry.documents.Actor|null}
   */
  get actor() {
    let actor;
    if (game.canvas.ready) actor = canvas.tokens.controlled[0]?.actor;
    return actor ?? game.user.character;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    if (!this.actor) return {};

    const effects = {
      primary: {
        enabled: [],
        disabled: [],
        passive: [],
      },
      secondary: {
        enabled: [],
        disabled: [],
      },
    };

    const hideDisabled = game.settings.get(MODULE, HIDE_DISABLED);
    const hidePassive = game.settings.get(MODULE, HIDE_PASSIVE);

    const skipping = effect => {
      if (effect.isSuppressed) return true;
      const data = effect.flags[MODULE]?.data ?? {};
      if (data.inclusion === 1) return false;
      if (data.inclusion === -1) return true;

      if (!effect.isTemporary && hidePassive) return true;
      if (effect.disabled && hideDisabled) return true;

      return false;
    };

    // Set up primary effects.
    for (const effect of this.actor.allApplicableEffects()) {
      if (skipping(effect)) continue;

      const context = await this.#prepareEffect(effect);
      if (!context) continue;

      if (effect.disabled) effects.primary.disabled.push(context);
      else if (effect.isTemporary) effects.primary.enabled.push(context);
      else effects.primary.passive.push(context);
    }

    // Set up secondary effects.
    if (game.system.id !== "dnd5e") return effects;
    for (const item of this.actor.items) {
      for (const effect of item.allApplicableEffects()) {
        if (skipping(effect, true)) continue;

        const context = await this.#prepareEffect(effect);
        if (!context) continue;
        if (effect.disabled) effects.secondary.disabled.push(context);
        else effects.secondary.enabled.push(context);
      }
    }

    return effects;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare context for an effect.
   * @param {foundry.documents.ActiveEffect} effect
   * @returns {Promise<object|null>}
   */
  async #prepareEffect(effect) {
    const context = {
      strings: {
        intro: "",
        content: "",
      },
    };

    if (effect.isTemporary) {
      const rem = effect.duration.remaining;
      context.isExpired = Number.isNumeric(rem) && (rem <= 0);
      context.isInfinite = rem === null;
      context.durationLabel = VisualActiveEffects.remainingTimeLabel(effect);
    }

    const buttons = [];

    /**
     * A hook that is called for other modules to add buttons to the pannel.
     * Each button must have `label` and a `callback` function.
     * @param {ActiveEffect} effect     The effect.
     * @param {object[]} buttons        The button.
     */
    Hooks.callAll(`${MODULE}.createEffectButtons`, effect, buttons);

    context.buttons = buttons.filter(button => {
      if (!(typeof button.label === "string") || !(button.callback instanceof Function)) return false;

      button.id = foundry.utils.randomID();
      this.buttons.push(button);

      return true;
    });

    context.buttonHeight = buttons.length * 32 + (buttons.length - 1) * 3;

    // Get roll data.
    let rollData;
    try {
      if (effect.origin) {
        let origin = fromUuidSync(effect.origin);
        if (origin?.documentName === "ActiveEffect") origin = origin.parent;
        if (origin?.pack) origin = effect.parent;
        if (typeof origin?.getRollData === "function") rollData = origin.getRollData();
      }
      if (!rollData) rollData = effect.parent.getRollData();
    } catch (err) {
      rollData = {};
    }

    const intro = effect.description;
    if (intro) context.strings.intro = await foundry.applications.ux.TextEditor.implementation.enrichHTML(intro, {
      rollData: rollData, relativeTo: effect,
    });
    context.hasText = !!intro;
    context.effect = effect;

    const allowed = Hooks.call(`${MODULE}.prepareActiveEffectContext`, effect, context);
    if (allowed === false) return null;

    context.tooltip = await foundry.applications.handlebars.renderTemplate(
      `modules/${MODULE}/templates/tooltip.hbs`,
      context,
    );

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _insertElement(element) {
    const existing = document.getElementById(element.id);
    if (existing) existing.replaceWith(element);
    else document.querySelector("#interface").insertAdjacentElement("afterbegin", element);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(...args) {
    await super._onRender(...args);

    if (game.user.isGM || game.settings.get(MODULE, PLAYER_CLICKS)) {
      for (const element of this.element.querySelectorAll(".effect-icon")) {
        element.addEventListener("dblclick", VisualActiveEffects.#toggleEffect.bind(this));
      }
    }
  }

  /* -------------------------------------------------- */
  /*   Event handlers                                   */
  /* -------------------------------------------------- */

  /**
   * Delete an effect.
   * @this {VisualActiveEffects}
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static async #deleteEffect(event, target) {
    const alt = event.shiftKey;
    const effect = await fromUuid(target.closest("[data-effect-uuid]").dataset.effectUuid);
    if (alt && game.user.isGM) effect.delete();
    else effect.deleteDialog();
  }

  /* -------------------------------------------------- */

  /**
   * Toggle an effect.
   * @this {VisualActiveEffects}
   * @param {PointerEvent} event    The initiating double-click event.
   */
  static async #toggleEffect(event) {
    const alt = event.ctrlKey || event.metaKey;
    const effect = await fromUuid(event.currentTarget.closest("[data-effect-uuid]").dataset.effectUuid);
    if (alt) effect.sheet.render({ force: true });
    else effect.update({ disabled: !effect.disabled });
  }

  /* -------------------------------------------------- */
  /*   Helpers                                          */
  /* -------------------------------------------------- */

  /**
   * How many days are there per week?
   * @type {number}
   */
  static get DAYS_PER_WEEK() {
    return game.time.calendar.days.values.length;
  }

  /* -------------------------------------------------- */

  /**
   * How many seconds are there in a minute?
   * @type {number}
   */
  static get SECONDS_PER_MINUTE() {
    return game.time.calendar.days.secondsPerMinute;
  }

  /* -------------------------------------------------- */

  /**
   * How many seconds are there in an hour?
   * @type {number}
   */
  static get SECONDS_PER_HOUR() {
    return game.time.calendar.days.minutesPerHour * game.time.calendar.days.secondsPerMinute;
  }

  /* -------------------------------------------------- */

  /**
   * How many seconds are there in one day?
   * @type {number}
   */
  static get SECONDS_PER_DAY() {
    const { hoursPerDay, minutesPerHour, secondsPerMinute } = game.time.calendar.days;
    return hoursPerDay * minutesPerHour * secondsPerMinute;
  }

  /* -------------------------------------------------- */

  /**
   * How many seconds are there in a week?
   * @type {number}
   */
  static get SECONDS_PER_WEEK() {
    return VisualActiveEffects.DAYS_PER_WEEK * VisualActiveEffects.SECONDS_PER_DAY;
  }

  /* -------------------------------------------------- */

  /**
   * How many seconds are there in one year?
   * @type {number}
   */
  static get SECONDS_PER_YEAR() {
    return VisualActiveEffects.SECONDS_PER_DAY * game.time.calendar.days.daysPerYear;
  }

  /* -------------------------------------------------- */

  /**
   * Convert a number of seconds to minutes (rounded up).
   * @param {number} seconds    Number of seconds.
   * @returns {number}          Number of minutes.
   */
  static secondsToMinutes(seconds) {
    return game.time.calendar.timeToComponents(seconds).minute;
  }

  /* -------------------------------------------------- */

  /**
   * Convert a number of seconds to hours (rounded up).
   * @param {number} seconds    Number of seconds.
   * @returns {number}          Number of hours.
   */
  static secondsToHours(seconds) {
    return game.time.calendar.timeToComponents(seconds).hour;
  }

  /* -------------------------------------------------- */

  /**
   * Convert a number of seconds to days (rounded up).
   * @param {number} seconds    Number of seconds.
   * @returns {number}          Number of days.
   */
  static secondsToDays(seconds) {
    return game.time.calendar.timeToComponents(seconds).day;
  }

  /* -------------------------------------------------- */

  /**
   * Convert a number of seconds to weeks (rounded up).
   * @param {number} seconds    Number of seconds.
   * @returns {number}          Number of weeks.
   */
  static secondsToWeeks(seconds) {
    return Math.ceil(VisualActiveEffects.secondsToDays(seconds) / VisualActiveEffects.DAYS_PER_WEEK);
  }

  /* -------------------------------------------------- */

  /**
   * Convert a number of seconds to years (rounded up).
   * @param {number} seconds    Number of seconds.
   * @returns {number}          Number of years.
   */
  static secondsToYears(seconds) {
    return Math.ceil(seconds / VisualActiveEffects.SECONDS_PER_YEAR);
  }

  /* -------------------------------------------------- */

  /**
   * Convert a number of seconds to a proper label.
   * @param {number} seconds    Number of seconds.
   * @returns {string}         The contents of a tag.
   */
  static convertSecondsToTag(seconds) {
    if (seconds >= VisualActiveEffects.SECONDS_PER_YEAR) {
      return game.i18n.format("VISUAL_ACTIVE_EFFECTS.TIME.YEARS", {
        qty: VisualActiveEffects.secondsToYears(seconds),
      });
    }

    if (seconds >= VisualActiveEffects.SECONDS_PER_WEEK) {
      return game.i18n.format("VISUAL_ACTIVE_EFFECTS.TIME.WEEKS", {
        qty: VisualActiveEffects.secondsToWeeks(seconds),
      });
    }

    if (seconds >= VisualActiveEffects.SECONDS_PER_DAY) {
      return game.i18n.format("VISUAL_ACTIVE_EFFECTS.TIME.DAYS", {
        qty: VisualActiveEffects.secondsToDays(seconds),
      });
    }

    if (seconds >= VisualActiveEffects.SECONDS_PER_HOUR) {
      return game.i18n.format("VISUAL_ACTIVE_EFFECTS.TIME.HOURS", {
        qty: VisualActiveEffects.secondsToHours(seconds),
      });
    }

    if (seconds >= VisualActiveEffects.SECONDS_PER_MINUTE) {
      return game.i18n.format("VISUAL_ACTIVE_EFFECTS.TIME.MINUTES", {
        qty: VisualActiveEffects.secondsToMinutes(seconds),
      });
    }

    if (seconds > 0) {
      return game.i18n.format("VISUAL_ACTIVE_EFFECTS.TIME.SECONDS", { qty: seconds });
    }

    return game.i18n.format("VISUAL_ACTIVE_EFFECTS.TIME.EXPIRED");
  }

  /* -------------------------------------------------- */

  /**
   * Helper function to get remaining duration.
   * @param {ActiveEffect} effect   The effect.
   * @returns {string|null}         Human-readable label describing remaining time.
   */
  static remainingTimeLabel(effect) {
    // Case 1: Duration measured in rounds and turns.
    if (effect.duration.type === "turns") {
      if (effect.duration.remaining === null) return game.i18n.localize("VISUAL_ACTIVE_EFFECTS.TIME.UNLIMITED");
      else if (effect.duration.remaining === 0) return game.i18n.localize("VISUAL_ACTIVE_EFFECTS.TIME.EXPIRED");
      return effect.duration.label;
    }

    // Case 2: Duration measured in seconds.
    else if (effect.duration.type === "seconds") {
      return VisualActiveEffects.convertSecondsToTag(effect.duration.remaining);
    }

    // Case 3: Neither rounds, turns, or seconds, so just return unlimited.
    return game.i18n.localize("VISUAL_ACTIVE_EFFECTS.TIME.UNLIMITED");
  }
}

// Hooks.on(`${MODULE}.createEffectButtons`, (effect, buttons) => {
//   buttons.push({
//     label: "Click me!",
//     callback: () => ui.notifications.info("CLICKED!"),
//   });
//   buttons.push({
//     label: "Click me!",
//     callback: () => ui.notifications.info("CLICKED!"),
//   });
//   buttons.push({
//     label: "Click me!",
//     callback: () => ui.notifications.info("CLICKED!"),
//   });
// });

/* -------------------------------------------------- */

Hooks.once("ready", () => {
  document.addEventListener("click", event => {
    const btn = event.target.closest("[data-action=customButton].vae-button");
    if (!btn) return;
    const id = btn.dataset.id;
    const button = ui.visualActiveEffects.buttons.find(b => b.id === id);
    if (button) button.callback(event);
  });
});
