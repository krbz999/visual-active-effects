import {ICON, MODULE} from "./constants.mjs";

export default class VisualActiveEffectsEditor extends FormApplication {
  constructor(effect, ...T) {
    super(effect, ...T);
    this.effect = effect;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 450,
      height: 500,
      classes: [MODULE, "sheet"],
      resizable: true,
      scrollY: [],
      tabs: [{navSelector: ".tabs", contentSelector: "form", initial: "intro"}],
      dragDrop: [],
      closeOnSubmit: false
    });
  }

  get title() {
    return game.i18n.format("VISUAL_ACTIVE_EFFECTS.EDITOR_TITLE", {name: this.effect.name});
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

    // Backwards compatibility.
    let inclusion;
    if ("inclusion" in flag) inclusion = flag.inclusion;
    else if (data.forceInclude === true) inclusion = 1;
    else inclusion = 0;

    foundry.utils.mergeObject(data, {
      inclusion: inclusion,
      content: await TextEditor.enrichHTML(flag.content || ""),
      intro: await TextEditor.enrichHTML(this.effect.description || ""),
      editable: this.isEditable,
      ICON: ICON
    });

    return data;
  }

  /** @override */
  async _updateObject(event, formData) {
    ui.notifications.info("VISUAL_ACTIVE_EFFECTS.EDITOR_SAVED", {localize: true});
    if (event.submitter) this.close();
    const sheet = this.effect.sheet;
    if (sheet) formData = sheet._getSubmitData(formData);
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
  render(...T) {
    this.effect.apps[this.id] = this;
    return super.render(...T);
  }

  /** @override */
  close(...T) {
    delete this.effect.apps[this.id];
    return super.close(...T);
  }
}
