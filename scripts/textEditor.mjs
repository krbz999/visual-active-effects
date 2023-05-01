import {ICON, MODULE} from "./constants.mjs";

export default class VisualActiveEffectsEditor extends FormApplication {
  constructor(effect, ...T) {
    super(effect, ...T);
    this.effect = effect;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 450,
      height: 800,
      classes: [MODULE, "sheet"],
      resizable: true,
      scrollY: [],
      tabs: [{navSelector: ".tabs", contentSelector: "form", initial: "intro"}],
      dragDrop: [],
      closeOnSubmit: false
    });
  }

  get template() {
    return `modules/${MODULE}/templates/vae-editor.hbs`;
  }

  get id() {
    return `${MODULE}-editor-${this.effect.uuid.replaceAll(".", "-")}`;
  }

  /** @override */
  async getData() {
    const data = await super.getData();
    const flag = this.effect.getFlag(MODULE, "data") ?? {};

    foundry.utils.mergeObject(data, {
      statuses: this.effect.statuses.size ? this.effect.statuses : [""],
      forceInclude: flag.forceInclude === true,
      content: await TextEditor.enrichHTML(flag.content ?? "", {async: true, relativeTo: this.effect}),
      intro: await TextEditor.enrichHTML(this.effect.description || flag.intro || "", {async: true, relativeTo: this.effect}),
      editable: this.isEditable,
      ICON: ICON
    });

    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelector("[data-action='add-status']").addEventListener("click", this._onAddStatus.bind(this));
  }

  /**
   * Handle adding a new row for a status.
   * @param {PointerEvent} event      The initiating click event.
   */
  _onAddStatus(event) {
    const stats = event.currentTarget.closest(".config").querySelectorAll(".form-group.status");
    const lastStat = stats[stats.length - 1];
    const div = document.createElement("DIV");
    div.innerHTML = `
    <div class="form-group status">
      <label>${game.i18n.localize("VISUAL_ACTIVE_EFFECTS.STATUS_ID")}</label>
      <div class="form-fields">
        <input type="text" name="statuses">
      </div>
    </div>`;
    lastStat.after(div.firstElementChild);
  }

  /** @override */
  async _updateObject(event, formData) {
    if (typeof formData.statuses === "string") formData.statuses = [formData.statuses];
    formData.statuses = formData.statuses.reduce((acc, s) => {
      s = s.trim();
      if (s) acc.push(s);
      return acc;
    }, []);
    formData.description = formData["flags.visual-active-effects.data.intro"];
    ui.notifications.info("VISUAL_ACTIVE_EFFECTS.EDITOR_SAVED", {localize: true});
    if (event.submitter) this.close();
    await this.effect.sheet?.submit({preventClose: true, preventRender: true});
    return this.effect.update(formData);
  }

  /** @override */
  async activateEditor(name, options = {}, initialContent = "") {
    options.relativeLinks = false;
    options.plugins = {
      menu: ProseMirror.ProseMirrorMenu.build(ProseMirror.defaultSchema, {
        compact: true,
        destroyOnSave: false,
        onSave: () => this.saveEditor(name, {remove: true})
      })
    };
    return super.activateEditor(name, options, initialContent);
  }

  /** @override */
  _render(...T) {
    this.effect.apps[this.appId] = this;
    return super._render(...T);
  }

  /** @override */
  close(...T) {
    delete this.effect.apps[this.appId];
    return super.close(...T);
  }
}
