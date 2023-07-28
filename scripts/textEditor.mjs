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
    html[0].querySelectorAll("[data-action='delete-status']").forEach(n => n.addEventListener("click", this._onDeleteStatus.bind(this)));
  }

  /**
   * Handle removing an old row for a status.
   * @param {PointerEvent} event      The initiating click event.
   */
  _onDeleteStatus(event) {
    event.currentTarget.closest(".form-group").remove();
  }

  /**
   * Handle adding a new row for a status.
   * @param {PointerEvent} event      The initiating click event.
   */
  async _onAddStatus(event) {
    const force = event.currentTarget.closest(".config").querySelector(".form-group:last-child");
    const div = document.createElement("DIV");
    div.innerHTML = await renderTemplate("modules/visual-active-effects/templates/status.hbs", []);
    div.querySelector("[data-action='delete-status']").addEventListener("click", this._onDeleteStatus.bind(this));
    force.before(div.firstElementChild);
  }

  /** @override */
  async _updateObject(event, formData) {
    if (!formData.statuses) formData.statuses = [];
    else if (typeof formData.statuses === "string") formData.statuses = [formData.statuses];
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
