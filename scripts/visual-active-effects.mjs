import {HIDE_DISABLED, HIDE_PASSIVE, MODULE} from "./constants.mjs";

export class VisualActiveEffects extends Application {
  // Array of buttons for other modules.
  buttons = [];

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: MODULE,
      popOut: false,
      template: `modules/${MODULE}/templates/${MODULE}.hbs`
    });
  }

  constructor() {
    super();
    this.refresh = foundry.utils.debounce(this.render.bind(this), 100);
    this._initialSidebarWidth = ui.sidebar.element.outerWidth();
  }

  /** @override */
  async getData() {
    const enabledEffects = [];
    const disabledEffects = [];
    const passiveEffects = [];

    const effects = this._getEffectsFromActor();
    if (!effects) return {};
    const hideDisabled = game.settings.get(MODULE, HIDE_DISABLED);
    const hidePassive = game.settings.get(MODULE, HIDE_PASSIVE);
    const locale = game.i18n.localize("VISUAL_ACTIVE_EFFECTS.LABELS.DETAILS");

    // set up enabled effects.
    for (const eff of effects) {
      const desc = foundry.utils.getProperty(eff, "flags.convenientDescription");
      const {intro, header, content, forceInclude = false} = eff.getFlag(MODULE, "data") ?? {};

      const {
        _id, icon, label, uuid, isTemporary, isExpired,
        remainingSeconds, turns, disabled, infinite, src
      } = eff;

      const effect = {
        _id, icon, label, uuid, isTemporary, isExpired,
        remainingSeconds, turns, infinite, src,
        strings: {intro: "", content: ""}
      };

      if (intro?.length || desc?.length) {
        effect.strings.intro = await TextEditor.enrichHTML(intro ?? desc, {async: true});
      }
      if (eff.buttons.length) {
        effect.buttons = eff.buttons;
        for (const button of eff.buttons) {
          const id = foundry.utils.randomID();
          this.buttons.push({id, callback: button.callback});
          button.id = id;
        }
      }
      if (content?.length) {
        if (header?.length) effect.strings.header = header;
        else effect.strings.header = locale;
        effect.strings.content = await TextEditor.enrichHTML(content, {async: true});
      }

      if (disabled) {
        if (!hideDisabled || forceInclude) disabledEffects.push(effect);
      }
      else if (isTemporary) enabledEffects.push(effect);
      else if (!hidePassive || forceInclude) passiveEffects.push(effect);
    }
    return {enabledEffects, disabledEffects, passiveEffects};
  }

  /**
   * Helper method for getData.
   * @returns {array}     An array of effect data.
   */
  _getEffectsFromActor() {
    if (!this.actor) return;
    return this.actor.effects.map((effect) => {
      const src = this._getSourceName(effect);
      const effectData = effect.clone({}, {keepId: true});
      if (effectData.isTemporary) {
        effectData.remainingSeconds = this._getSecondsRemaining(effectData.duration);
        effectData.turns = effectData.duration.turns;
        effectData.isExpired = effectData.remainingSeconds <= 0;
        effectData.infinite = effectData.remainingSeconds === Infinity;
      }
      effectData.supp = effect.isSuppressed;
      effectData.src = src;
      const buttons = [];

      /**
       * A hook that is called such that other modules can add buttons to the description
       * of an effect on the panel. Each object pushed into the array must have 'label' and
       * a function 'callback'.
       * @param {ActiveEffect} effect     The original effect.
       * @param {Array} buttons           An array of buttons.
       */
      Hooks.callAll("visual-active-effects.createEffectButtons", effect, buttons);

      effectData.buttons = buttons;
      return effectData;
    }).filter(effectData => {
      return !effectData.supp;
    });
  }

  /**
   * Helper method for getData.
   * @returns {boolean|string}    The label to use for the effect.
   */
  _getSourceName(effect) {
    if (!effect.origin) return false;
    try {
      return fromUuidSync(effect.origin).name;
    } catch {
      return false;
    }
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
   */
  get actor() {
    return canvas.tokens.controlled[0]?.actor ?? game.user.character;
  }

  /** @override */
  async _render(force = false, options = {}) {
    await super._render(force, options);
    if (ui.sidebar._collapsed) this.element.css("right", "50px");
    else this.element.css("right", `${this._initialSidebarWidth + 18}px`);
  }

  /** @override */
  activateListeners(html) {
    html[0].querySelectorAll(".effect-icon").forEach(n => n.addEventListener("contextmenu", this.onIconRightClick.bind(this)));
    html[0].querySelectorAll(".effect-icon").forEach(n => n.addEventListener("dblclick", this.onIconDoubleClick.bind(this)));
    html[0].querySelectorAll(".collapsible-header").forEach(n => n.addEventListener("click", this.onCollapsibleClick.bind(this)));
    html[0].querySelectorAll("[data-action='custom-button']").forEach(n => n.addEventListener("click", this.onClickCustomButton.bind(this)));
  }

  /**
   * When a button on the panel is clicked.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {function}              The callback function.
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
   * @param {PointerEvent} event                    The initiating click event.
   * @returns {ActiveEffect|Promise<boolean>}       Either the deleted effect, or the result of the prompt.
   */
  async onIconRightClick(event) {
    const effect = await fromUuid(event.currentTarget.closest(".effect-item").dataset.effectUuid);
    if (event.shiftKey && game.user.isGM) return effect.delete();
    const stringA = "VISUAL_ACTIVE_EFFECTS.MISC.DELETE_ME";
    const content = game.i18n.format(stringA, {label: effect.label});
    const stringB = "VISUAL_ACTIVE_EFFECTS.MISC.DELETE_EFFECT";
    const title = game.i18n.localize(stringB);
    const yes = () => effect.delete();
    return Dialog.confirm({title, content, yes});
  }

  /**
   * Handle enabling/disabling an effect when double-clicked, or showing its sheet.
   * @param {PointerEvent} event                    The initiating click event.
   * @returns {ActiveEffect|ActiveEffectConfig}     The updated effect or its sheet.
   */
  async onIconDoubleClick(event) {
    if (!event.ctrlKey) {
      const effect = await fromUuid(event.currentTarget.closest(".effect-item").dataset.effectUuid);
      return effect.update({disabled: !effect.disabled});
    } else {
      const effect = await fromUuid(event.currentTarget.closest(".effect-item").dataset.effectUuid);
      return effect.sheet.render(true);
    }
  }

  /**
   * Handle collapsing the description of an effect.
   * @param {PointerEvent} event      The initiating click event.
   */
  onCollapsibleClick(event) {
    const section = event.currentTarget.closest(".collapsible-section");
    section.classList.toggle("active");
    const div = section.querySelector(".collapsible-content");
    const header = event.currentTarget;
    const tags = event.currentTarget.closest(".effect-item").querySelector(".effect-tags");
    const win = window.innerHeight;
    div.style.maxHeight = `${win - (50 + header.getBoundingClientRect().bottom + tags.getBoundingClientRect().height)}px`;
  }
}
