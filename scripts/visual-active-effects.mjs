import {HIDE_DISABLED, HIDE_PASSIVE, MODULE, PLAYER_CLICKS} from "./constants.mjs";
import {remainingTimeLabel} from "./helpers.mjs";

export class VisualActiveEffects extends Application {
  /**
   * Array of buttons for other modules.
   * @type {object[]}
   */
  buttons = [];

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: MODULE,
      popOut: false,
      template: `modules/${MODULE}/templates/${MODULE}.hbs`,
      minimizable: false
    });
  }

  /** @constructor */
  constructor() {
    super();
    this._initialSidebarWidth = ui.sidebar.element.outerWidth();
    this._playerClicks = game.settings.get(MODULE, PLAYER_CLICKS);
  }

  /** @override */
  async getData() {
    const enabledEffects = [];
    const disabledEffects = [];
    const passiveEffects = [];

    const fromActor = this._getEffectsFromActor();
    if (!fromActor) return {};
    const hideDisabled = game.settings.get(MODULE, HIDE_DISABLED);
    const hidePassive = game.settings.get(MODULE, HIDE_PASSIVE);

    // Set up effects.
    for (const entry of fromActor) {

      // Set up the various text (intro and content).
      const data = entry.effect.flags[MODULE]?.data ?? {};

      // Get the effect rollData to populate enrichers within the descriptions.
      let rollData;
      try {
        if (entry.effect.origin) {
          let origin = fromUuidSync(entry.effect.origin);
          if (origin?.documentName === ActiveEffect.documentName) {
            // Change the origin to the parent of the ActiveEffect - the originating item or actor.
            origin = origin.parent;
          }
          if (origin?.pack) {
            // Origin references a compendium, change the origin to the effect's parent - the local item or actor.
            origin = entry.effect.parent;
          }
          if (typeof origin?.getRollData === "function") {
            rollData = origin.getRollData();
          }
        }

        // Fallback to the parent if there's no rollData.
        if (!rollData) rollData = entry.effect.parent.getRollData();
      } catch (_) {
        // Fallback to just an empty object - enrichers will show empty values in this case.
        rollData = {};
      }

      // Always exclude?
      const forceExclude = data.inclusion === -1;
      if (forceExclude) continue;

      // Set up intro if it exists.
      const intro = entry.effect.description;
      if (intro) entry.context.strings.intro = await TextEditor.enrichHTML(intro, {
        rollData: rollData,
        relativeTo: entry.effect
      });

      entry.context.hasText = !!intro;

      // Add to either disabled array, enabled array, or passive array.
      if (entry.effect.disabled) {
        if (!hideDisabled || (data.inclusion === 1)) disabledEffects.push(entry);
      }
      else if (entry.effect.isTemporary) enabledEffects.push(entry);
      else if (!hidePassive || (data.inclusion === 1)) passiveEffects.push(entry);
    }
    return {enabledEffects, disabledEffects, passiveEffects};
  }

  /**
   * Helper method for getData, extracting each effect, filtering the suppressed, and returning it with additional context.
   * @returns {object[]}      An array with 'effect' and 'context'.
   */
  _getEffectsFromActor() {
    if (!this.actor) return;
    const data = [];
    const effects = this.actor.allApplicableEffects();
    for (const effect of effects) {
      if (effect.isSuppressed) continue;
      const context = {strings: {intro: "", content: ""}};
      if (effect.isTemporary) {
        const rem = effect.duration.remaining;
        context.isExpired = Number.isNumeric(rem) && (rem <= 0);
        context.isInfinite = rem === null;
        context.durationLabel = remainingTimeLabel(effect);
      }
      const buttons = [];

      /**
       * A hook that is called such that other modules can add buttons to the description of an effect
       * on the panel. Each object pushed into the array must have 'label' and a function 'callback'.
       * @param {ActiveEffect} effect     The original effect.
       * @param {Array} buttons           An array of buttons.
       */
      Hooks.callAll("visual-active-effects.createEffectButtons", effect, buttons);

      // Filter out invalid buttons and push valid ones into this.buttons in one go.
      context.buttons = buttons.reduce((acc, b) => {
        if (!(typeof b.label === "string") || !(b.callback instanceof Function)) return acc;
        b.id = foundry.utils.randomID();
        this.buttons.push(b);
        acc.push(b);
        return acc;
      }, []);

      data.push({effect, context});
    }
    return data;
  }

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

  /**
   * The currently selected token's actor, otherwise the user's assigned actor.
   * @type {Actor|null}
   */
  get actor() {
    let actor;
    if (canvas.ready) actor = canvas.tokens.controlled[0]?.actor;
    return actor ?? game.user.character;
  }

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

  /**
   * Debounce rendering of the app.
   * @param {boolean} force                       Whether to force the rendering of the app.
   * @returns {Promise<VisualActiveEffects>}      This application.
   */
  async refresh(force) {
    return foundry.utils.debounce(this.render.bind(this, force), 100)();
  }

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

  /** @override */
  bringToTop(event) {
    const element = event.currentTarget;
    const z = document.defaultView.getComputedStyle(element).zIndex;
    if (z < _maxZ) {
      element.style.zIndex = Math.min(++_maxZ, 99999);
      ui.activeWindow = this;
    }
  }

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
