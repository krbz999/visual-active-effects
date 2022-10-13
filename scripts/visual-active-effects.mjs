import { MODULE } from "./constants.mjs";
import { getEffectData } from "./helpers.mjs";

export class VisualEffects extends Application {
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

  async getData() {
    return getEffectData(this.actor);
  }

  activateListeners(html) {
    html[0].addEventListener("contextmenu", this.onIconRightClick.bind(this));
    html[0].addEventListener("dblclick", this.onIconDoubleClick.bind(this));
  }

  handleExpand(_, bool) {
    if (!bool) {
      const right = `${this._initialSidebarWidth + 18}px`;
      this.element.animate({ right }, 0);
    } else this.element.delay(50).animate({ right: "50px" }, 500);
  }

  get actor() {
    return canvas.tokens.controlled[0]?.actor ?? game.user.character;
  }

  async _render(force = false, options = {}) {
    await super._render(force, options);
    if (ui.sidebar._collapsed) this.element.css("right", "50px");
    else this.element.css("right", `${this._initialSidebarWidth + 18}px`);
  }

  async onIconRightClick(event) {
    const div = event.target.closest("div[data-effect-id]");
    if (!div) return;
    const effectId = div.dataset.effectId;
    const effect = this.actor.effects.get(effectId);
    if (!effect) return;

    const stringA = "VISUAL_ACTIVE_EFFECTS.MISC.DELETE_ME";
    const content = game.i18n.format(stringA, { label: effect.label });
    const stringB = "VISUAL_ACTIVE_EFFECTS.MISC.DELETE_EFFECT";
    const title = game.i18n.localize(stringB);
    const yes = () => effect.delete();

    await Dialog.confirm({ title, content, yes });
  }

  onIconDoubleClick(event) {
    const div = event.target.closest("div[data-effect-id]");
    if (!div) return;
    const effectId = div.dataset.effectId;
    const effect = this.actor.effects.get(effectId);
    if (!effect) return;
    return effect.update({ disabled: !effect.disabled });
  }
}
