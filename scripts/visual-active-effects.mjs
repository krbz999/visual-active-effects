import {HIDE_DISABLED, HIDE_PASSIVE, MODULE, PLAYER_CLICKS} from "./constants.mjs";
import {remainingTimeLabel} from "./helpers.mjs";

export default class VisualActiveEffects extends Application {
  /* -------------------------------------------------- */
  /*   Properties                                       */
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

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: MODULE,
      popOut: false,
      template: `modules/${MODULE}/templates/${MODULE}.hbs`,
      minimizable: false
    });
  }

  /* -------------------------------------------------- */
  /*   Rendering                                        */
  /* -------------------------------------------------- */

  /** @constructor */
  constructor() {
    super();
    this._initialSidebarWidth = ui.sidebar.element.outerWidth();
    this._playerClicks = game.settings.get(MODULE, PLAYER_CLICKS);
  }

  /* -------------------------------------------------- */

  /** @override */
  async getData() {
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

    const skipping = effect => {
      if (effect.isSuppressed) return false;
      const data = effect.flags[MODULE]?.data ?? {};
      if (data.inclusion === 1) return true;
      if (data.inclusion === -1) return false;

      if (effect.disabled) return hideDisabled;
      if (effect.isTemporary) return false;
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
        if (!effect.isTemporary) continue;
        if (skipping(effect)) continue;

        const context = await this.#prepareEffect(effect);
        if (effect.disabled) effects.secondary.disabled.push(context);
        else effects.secondary.enabled.push(context);
      }
    }

    return effects;
  }

  /* -------------------------------------------------- */

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

  /** @override */
  async _render(force = false, options = {}) {
    if (!force && this.element[0].closest(".panel").classList.contains("hovered")) {
      this._needsRefresh = true;
      return;
    }
    await super._render(force, options);
    this._needsRefresh = false;
    if (ui.sidebar._collapsed) this.element.css("right", "50px");
    else this.element.css("right", `${this._initialSidebarWidth + 18}px`);
  }

  /* -------------------------------------------------- */
  /*   Instance methods                                 */
  /* -------------------------------------------------- */

  /**
   * Debounce rendering of the app.
   * @param {boolean} force                       Whether to force the rendering of the app.
   * @returns {Promise<VisualActiveEffects>}      This application.
   */
  async refresh(force) {
    return foundry.utils.debounce(this.render.bind(this, force), 100)();
  }

  /* -------------------------------------------------- */

  /** @override */
  bringToTop(event) {
    const element = event.currentTarget;
    const z = document.defaultView.getComputedStyle(element).zIndex;
    if (z < _maxZ) {
      element.style.zIndex = Math.min(++_maxZ, 99999);
      ui.activeWindow = this;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Helper method to move the panel when the sidebar is collapsed or expanded.
   * @param {Sidebar} _         The sidebar.
   * @param {boolean} bool      Whether it was collapsed.
   */
  handleExpand(_, bool) {
    if (!bool) {
      const right = `${this._initialSidebarWidth + 18}px`;
      this.element.css("right", right);
    } else this.element.delay(50).animate({right: "50px"}, 500);
  }

  /* -------------------------------------------------- */
  /*   Event handlers                                   */
  /* -------------------------------------------------- */

  /** @override */
  activateListeners(html) {
    if (this._playerClicks || game.user.isGM) {
      html[0].querySelectorAll(".effect-icon").forEach(n => n.addEventListener("contextmenu", this.onIconRightClick.bind(this)));
      html[0].querySelectorAll(".effect-icon").forEach(n => n.addEventListener("dblclick", this.onIconDoubleClick.bind(this)));
    }
    html[0].querySelectorAll("[data-action='custom-button']").forEach(n => n.addEventListener("click", this.onClickCustomButton.bind(this)));
    html[0].addEventListener("pointerover", this._onMouseOver.bind(this));
    html[0].addEventListener("pointerout", this._onMouseOver.bind(this));
    html[0].addEventListener("pointerover", this.bringToTop.bind(this));
    html[0].querySelectorAll(".effect-item").forEach(n => n.addEventListener("pointerenter", this._onMouseEnter.bind(this)));
  }

  /* -------------------------------------------------- */

  /**
   * Set the maximum height of effect descriptions.
   * @param {Event} event     Initiating hover event.
   */
  _onMouseEnter(event) {
    const info = event.currentTarget.querySelector(".effect-intro");
    if (!info) return;
    const win = window.innerHeight;
    info.style.maxHeight = `${win - (50 + info.getBoundingClientRect().top)}px`;
  }

  /* -------------------------------------------------- */

  /**
   * Save whether the application is being moused over.
   * @param {Event} event     The initiating mouseover or mouseout event.
   * @returns {Promise<void|VisualActiveEffects>}
   */
  _onMouseOver(event) {
    const state = event.type === "pointerover";
    const target = event.currentTarget;
    target.classList.toggle("hovered", state);
    if (!state && (this._needsRefresh === true)) return this.render();
  }

  /* -------------------------------------------------- */

  /**
   * When a button on the panel is clicked.
   * @param {Event} event     The initiating click event.
   * @returns {Promise}       Result of the callback function.
   */
  async onClickCustomButton(event) {
    const id = event.currentTarget.dataset.id;
    const button = this.buttons.find(b => b.id === id);
    return button.callback(event);
  }

  /* -------------------------------------------------- */

  /**
   * Handle deleting an effect when right-clicked.
   * @param {Event} event                           The initiating click event.
   * @returns {Promise<ActiveEffect|boolean>}       Either the deleted effect, or the result of the prompt.
   */
  async onIconRightClick(event) {
    const alt = event.shiftKey;
    const effect = await fromUuid(event.currentTarget.closest("[data-effect-uuid]").dataset.effectUuid);
    return (alt && game.user.isGM) ? effect.delete() : effect.deleteDialog();
  }

  /* -------------------------------------------------- */

  /**
   * Handle enabling/disabling an effect when double-clicked, or showing its sheet.
   * @param {Event} event                                     The initiating click event.
   * @returns {Promise<ActiveEffect|ActiveEffectConfig>}      The updated effect or its sheet.
   */
  async onIconDoubleClick(event) {
    const alt = event.ctrlKey || event.metaKey;
    const effect = await fromUuid(event.currentTarget.closest("[data-effect-uuid]").dataset.effectUuid);
    return alt ? effect.sheet.render(true) : effect.update({disabled: !effect.disabled});
  }
}
