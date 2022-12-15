import { MODULE } from "./constants.mjs";
import { getEffectData } from "./helpers.mjs";

export class VisualActiveEffects extends Application {
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
    html[0].addEventListener("click", this.onCollapsibleClick.bind(this));
  }

  handleExpand(_, bool) {
    if (!bool) {
      const right = `${this._initialSidebarWidth + 18}px`;
      this.element.css("right", right);
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
    if (!event.target.classList.contains("effect-icon")) return;
    const uuid = event.target.closest("[data-effect-uuid]")?.dataset.effectUuid;
    if (!uuid) return;
    const effect = await fromUuid(uuid);
    if (event.shiftKey && game.user.isGM) return effect.delete();
    const stringA = "VISUAL_ACTIVE_EFFECTS.MISC.DELETE_ME";
    const content = game.i18n.format(stringA, { label: effect.label });
    const stringB = "VISUAL_ACTIVE_EFFECTS.MISC.DELETE_EFFECT";
    const title = game.i18n.localize(stringB);
    const yes = () => effect.delete();
    return Dialog.confirm({ title, content, yes });
  }

  async onIconDoubleClick(event) {
    if (!event.target.classList.contains("effect-icon")) return;
    const uuid = event.target.closest("[data-effect-uuid]")?.dataset.effectUuid;
    if (!uuid) return;
    const effect = await fromUuid(uuid);
    return effect.update({ disabled: !effect.disabled });
  }

  onCollapsibleClick(event) {
    const t = event.target.closest(".visual-active-effects .collapsible-header");
    if (!t) return;
    const section = t.closest(".collapsible");
    section.classList.toggle("active");
    const div = section.querySelector(".collapsible-content");
    const item = section.closest(".effect-item");
    const header = item.querySelector(".collapsible-header");
    const tags = item.querySelector(".effect-tags");
    const win = window.innerHeight;
    div.style.maxHeight = `${win - (50 + header.getBoundingClientRect().bottom + tags.getBoundingClientRect().height)}px`;
  }
}
