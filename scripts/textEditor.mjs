import { MODULE } from "./constants.mjs";

export default class VisualActiveEffectsEditor extends FormApplication {
  constructor(effect, ...T) {
    super(effect, ...T);
    this.effect = effect;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 560,
      height: 800,
      classes: [MODULE, "sheet"],
      resizable: true,
      scrollY: [],
      tabs: [],
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

  async getData() {
    const data = await super.getData();

    foundry.utils.mergeObject(data, {
      statusId: this.effect.getFlag("core", "statusId") ?? "",
      forceInclude: this.effect.getFlag(MODULE, "data.forceInclude") === true,
      content: await TextEditor.enrichHTML(this.effect.getFlag(MODULE, "data.content") ?? "", { async: true, relativeTo: this.effect }),
      intro: await TextEditor.enrichHTML(this.effect.getFlag(MODULE, "data.intro") ?? "", { async: true, relativeTo: this.effect }),
      editable: this.isEditable
    });

    return data;
  }

  async _updateObject(event, formData) {
    for (const [key, val] of Object.entries(formData)) {
      if (formData[key]?.trim) formData[key] = formData[key].trim();
      if (val === "<p></p>") formData[key] = "";
    }
    ui.notifications.info("VISUAL_ACTIVE_EFFECTS.EDITOR_SAVED", { localize: true });
    if (event.submitter) this.close();
    return this.effect.update(formData);
  }

  async activateEditor(name, options = {}, initialContent = "") {
    options.relativeLinks = false;
    options.plugins = {
      menu: ProseMirror.ProseMirrorMenu.build(ProseMirror.defaultSchema, {
        compact: true,
        destroyOnSave: false,
        onSave: () => this.saveEditor(name, { remove: true })
      })
    };
    return super.activateEditor(name, options, initialContent);
  }

  _render(...T) {
    this.effect.apps[this.appId] = this;
    return super._render(...T);
  }

  close(...T) {
    delete this.effect.apps[this.appId];
    return super.close(...T);
  }
}
