import {
  FONT_SIZE,
  ICON_SIZE,
  MODULE,
  TOP_OFFSET,
} from "./constants.mjs";

/** Refreshes the style sheet when a user changes the various css-related module settings. */
export function applyStyleSettings() {
  const data = {};
  data["icon-size"] = Math.max(10, Math.round(game.settings.get(MODULE, ICON_SIZE) || 50));
  data["font-size"] = Math.max(6, Math.round(game.settings.get(MODULE, FONT_SIZE) || 16));
  data["max-width"] = Math.round(300 * data["font-size"] / 16);
  data["top-offset"] = Math.max(0, Math.round(game.settings.get(MODULE, TOP_OFFSET) || 25));
  const root = document.querySelector(":root");
  Object.entries(data).forEach(([key, val]) => root.style.setProperty(`--${MODULE}-${key}`, `${val}px`));
}

/** Register API functions. */
export function registerAPI() {
  game.modules.get(MODULE).api = {
    migrateWorldDescriptions: async function() {
      ui.notifications.info(`${MODULE.toUpperCase()} | Migrating actors and items in the sidebar. Please be patient.`);
      for (const item of game.items) await _migrateDocumentWithEffects(item);
      for (const actor of game.actors) await _migrateActor(actor);
      ui.notifications.info(`${MODULE.toUpperCase()} | Finished migrating sidebar actors and items.`);
    },
    migratePackDescriptions: async function(pack) {
      const isActor = pack.metadata.type === "Actor";
      const isItem = pack.metadata.type === "Item";
      if (!(isActor || isItem)) {
        console.warn(`${MODULE.toUpperCase()} | ${pack.metadata.label} (${pack.metadata.id}) is not a valid compendium type.`);
        return null;
      }
      ui.notifications.info(`${MODULE.toUpperCase()} | Migrating ${pack.metadata.label} (${pack.metadata.id}). Please be patient.`);
      const docs = await pack.getDocuments();
      const mig = isActor ? _migrateActor : _migrateDocumentWithEffects;
      for (const doc of docs) await mig(doc);
      ui.notifications.info(`${MODULE.toUpperCase()} | Finished migrating ${pack.metadata.label} (${pack.metadata.id}).`);
    },
  };
}

async function _migrateActor(actor) {
  await _migrateDocumentWithEffects(actor);
  for (const item of actor.items) {
    await _migrateDocumentWithEffects(item);
  }
}

async function _migrateDocumentWithEffects(doc) {
  const updates = [];
  for (const effect of doc.effects) {
    const data = effect.flags[MODULE]?.data?.intro;
    if (data) updates.push({ _id: effect.id, description: data });
  }
  if (updates.length) console.log(`${MODULE.toUpperCase()} | Migrating ${doc.name} (${doc.uuid})`);
  return doc.updateEmbeddedDocuments("ActiveEffect", updates);
}
