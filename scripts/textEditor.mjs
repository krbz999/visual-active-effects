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
      statusId: this.effect.flags.core?.statusId ?? "",
      forceInclude: flag.forceInclude === true,
      content: await TextEditor.enrichHTML(flag.content ?? "", {async: true, relativeTo: this.effect}),
      intro: await TextEditor.enrichHTML(flag.intro ?? "", {async: true, relativeTo: this.effect}),
      editable: this.isEditable,
      ICON: ICON
    });

    return data;
  }

  /** @override */
  async _updateObject(event, formData) {
    for (const [key, val] of Object.entries(formData)) {
      if (formData[key]?.trim) formData[key] = formData[key].trim();
      if (val === "<p></p>") formData[key] = "";
    }
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
