import {HIDE_DISABLED, HIDE_PASSIVE, MODULE, PLAYER_CLICKS} from "./constants.mjs";
import {remainingTimeLabel} from "./helpers.mjs";

export default class VisualActiveEffects extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actions: {
      customButton: VisualActiveEffects.#customButton,
      deleteEffect: {
        handler: VisualActiveEffects.#deleteEffect,
        buttons: [2]
      }
    },
    classes: [MODULE, "panel"],
    form: {},
    id: MODULE,
    window: {
      frame: false,
      minimizable: false,
      positioned: false,
      resizable: false
    }
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    main: {
      template: `modules/${MODULE}/templates/${MODULE}.hbs`,
      root: true
    }
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
   * @type {Actor|null}
   */
  get actor() {
    let actor;
    if (canvas.ready) actor = canvas.tokens.controlled[0]?.actor;
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
        passive: []
      },
      secondary: {
        enabled: [],
        disabled: []
      }
    };

    const hideDisabled = game.settings.get(MODULE, HIDE_DISABLED);
    const hidePassive = game.settings.get(MODULE, HIDE_PASSIVE);

    const skipping = (effect, isSecondary = false) => {
      if (effect.isSuppressed) return true;
      const data = effect.flags[MODULE]?.data ?? {};
      if (data.inclusion === 1) return false;
      if (data.inclusion === -1) return true;

      if (effect.disabled) return hideDisabled;
      if (effect.isTemporary) return false;

      if (isSecondary) return true;
      return hidePassive;
    };

    // Set up primary effects.
    for (const effect of this.actor.allApplicableEffects()) {
      if (skipping(effect)) continue;

      const context = await this.#prepareEffect(effect);

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
        if (effect.disabled) effects.secondary.disabled.push(context);
        else effects.secondary.enabled.push(context);
      }
    }

    return effects;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare context for an effect.
   * @param {ActiveEffect} effect
   * @returns {Promise<object>}
   */
  async #prepareEffect(effect) {
    const context = {
      strings: {
        intro: "",
        content: ""
      }
    };

    if (effect.isTemporary) {
      const rem = effect.duration.remaining;
      context.isExpired = Number.isNumeric(rem) && (rem <= 0);
      context.isInfinite = rem === null;
      context.durationLabel = remainingTimeLabel(effect);
    }

    const buttons = [];

    /**
     * A hook that is called for other modules to add buttons to the pannel.
     * Each button must have `label` and a `callback` function.
     * @param {ActiveEffect} effect     The effect.
     * @param {object[]} buttons        The button.
     */
    Hooks.callAll("visual-active-effects.createEffectButtons", effect, buttons);

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
    if (intro) context.strings.intro = await TextEditor.enrichHTML(intro, {
      rollData: rollData, relativeTo: effect
    });
    context.hasText = !!intro;
    context.effect = effect;

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Helper method for getData.
   * @param {object} duration     An effect's duration object.
   * @returns {number}            The time remaining.
   */
  _getSecondsRemaining(duration) {
    if (duration.seconds || duration.rounds) {
      const seconds = duration.seconds ?? duration.rounds * (CONFIG.time.roundTime ?? 6);
      return duration.startTime + seconds - game.time.worldTime;
    } else return Infinity;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async render(options = {}) {
    if (!options.force && this.element.closest(".panel").classList.contains("hovered")) {
      this._needsRefresh = true;
      return;
    }
    const result = await super.render(options);
    this._needsRefresh = false;
    return result;
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
  _onRender(...args) {
    super._onRender(...args);

    const playerInteraction = game.settings.get(MODULE, PLAYER_CLICKS);

    if (playerInteraction) {
      for (const element of this.element.querySelectorAll(".effect-icon")) {
        element.addEventListener("dblclick", VisualActiveEffects.#toggleEffect.bind(this));
      }
    }

    this.element.addEventListener("pointerover", VisualActiveEffects.#pointerOver.bind(this));
    this.element.addEventListener("pointerout", VisualActiveEffects.#pointerOut.bind(this));

    for (const element of this.element.querySelectorAll(".effect-item")) {
      element.addEventListener("pointerenter", VisualActiveEffects.#pointerEnter.bind(this));
    }
  }

  /* -------------------------------------------------- */
  /*   Event handlers                                   */
  /* -------------------------------------------------- */

  /**
   * Execute the function of a custom button.
   * @param {PointerEvent} event      The initiating click event.
   * @param {HTMLElement} target      The element that defined the [data-action].
   */
  static #customButton(event, target) {
    const id = target.dataset.id;
    const button = this.buttons.find(b => b.id === id);
    button.callback(event);
  }

  /* -------------------------------------------------- */

  /**
   * Delete an effect.
   * @param {PointerEvent} event      The initiating click event.
   * @param {HTMLElement} target      The element that defined the [data-action].
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
   * @param {PointerEvent} event      The initiating double-click event.
   */
  static async #toggleEffect(event) {
    const alt = event.ctrlKey || event.metaKey;
    const effect = await fromUuid(event.currentTarget.closest("[data-effect-uuid]").dataset.effectUuid);
    if (alt) effect.sheet.render({force: true});
    else effect.update({disabled: !effect.disabled});
  }

  /* -------------------------------------------------- */

  /**
   * Set the max height of effect description to prevent window overflow.
   * @param {PointerEvent} event      The inititing pointer event.
   */
  static #pointerEnter(event) {
    const info = event.currentTarget.querySelector(".effect-intro");
    if (!info) return;
    const win = window.innerHeight;
    info.style.maxHeight = `${win - (50 + info.getBoundingClientRect().top)}px`;
  }

  /* -------------------------------------------------- */

  /**
   * Add the `hovered` class to an element.
   * @param {PointerEvent} event      The initiating pointer event.
   */
  static #pointerOver(event) {
    const target = event.currentTarget;
    target.classList.add("hovered");
  }

  /* -------------------------------------------------- */

  /**
   * Remove the `hovered` class and optionally refresh the application.
   * @param {PointerEvent} event      The initiating pointer event.
   */
  static #pointerOut(event) {
    const target = event.currentTarget;
    target.classList.remove("hovered");
    if (this._needsRefresh === true) this.render();
  }
}
