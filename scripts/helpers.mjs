import {
  DAYS_PER_WEEK,
  EXTRA_DAYS_PER_YEAR,
  HIDE_DISABLED,
  HIDE_PASSIVE,
  MODULE,
  MONTHS_PER_YEAR,
  WEEKS_PER_MONTH
} from "./constants.mjs";
import VisualActiveEffectsEditor from "./textEditor.mjs";

// create the needed objects of effect data in enabled/disabled/passive arrays.
export async function getEffectData(actor) {
  const enabledEffects = [];
  const disabledEffects = [];
  const passiveEffects = [];

  const effects = getEffects(actor);
  const hideDisabled = game.settings.get(MODULE, HIDE_DISABLED);
  const hidePassive = game.settings.get(MODULE, HIDE_PASSIVE);
  const locale = game.i18n.localize("VISUAL_ACTIVE_EFFECTS.LABELS.DETAILS");

  // set up enabled effects.
  for (const eff of effects) {
    const desc = foundry.utils.getProperty(eff, "flags.convenientDescription");
    const { intro, header, content, forceInclude = false } = eff.getFlag(MODULE, "data") ?? {};

    const {
      _id, icon, label, uuid, isTemporary, isExpired,
      remainingSeconds, turns, disabled, infinite, src
    } = eff;

    const effect = {
      _id, icon, label, uuid, isTemporary, isExpired,
      remainingSeconds, turns, infinite, src,
      strings: { intro: "", content: "" }
    };

    if (intro?.length || desc?.length) {
      effect.strings.intro = await TextEditor.enrichHTML(intro ?? desc, { async: true });
    }
    if (content?.length) {
      if (header?.length) effect.strings.header = header;
      else effect.strings.header = locale;
      effect.strings.content = await TextEditor.enrichHTML(content, { async: true });
    }

    if (disabled) {
      if (!hideDisabled || forceInclude) disabledEffects.push(effect);
    }
    else if (isTemporary) enabledEffects.push(effect);
    else if (!hidePassive || forceInclude) passiveEffects.push(effect);
  }
  return { enabledEffects, disabledEffects, passiveEffects };
}

// gets all of an actor's effects, sorted, with some appended info.
function getEffects(actor) {
  if (!actor) return [];

  return actor.effects.map((effect) => {
    const src = getSourceName(effect);
    const effectData = effect.clone({}, { keepId: true });
    if (effectData.isTemporary) {
      effectData.remainingSeconds = getSecondsRemaining(effectData.duration);
      effectData.turns = effectData.duration.turns;
      effectData.isExpired = effectData.remainingSeconds <= 0;
      effectData.infinite = effectData.remainingSeconds === Infinity;
    }
    effectData.supp = effect.isSuppressed;
    effectData.src = src;
    return effectData;
  }).filter(effectData => {
    return !effectData.supp;
  });
}

function getSecondsRemaining(duration) {
  if (duration.seconds || duration.rounds) {
    const seconds = duration.seconds ?? duration.rounds * (CONFIG.time.roundTime ?? 6);
    return duration.startTime + seconds - game.time.worldTime;
  } else return Infinity;
}

function getSourceName(effect) {
  if (!effect.origin) return false;
  try {
    return fromUuidSync(effect.origin).name;
  } catch {
    return false;
  }
}

// Registers the handlebar helpers
export function registerHelpers() {
  Handlebars.registerHelper("remainingTimeLabel", (effect) => {

    const SECONDS = {
      IN_ONE_ROUND: 6,
      IN_ONE_MINUTE: 60,
      IN_TWO_MINUTES: 120,
      IN_ONE_HOUR: 3600,
      IN_TWO_HOURS: 7200,
      IN_ONE_DAY: 86400,
      IN_TWO_DAYS: 172800
    }

    const daysPerWeek = game.settings.get(MODULE, DAYS_PER_WEEK) ?? 9;
    const weeksPerMonth = game.settings.get(MODULE, WEEKS_PER_MONTH) ?? 3;
    const monthsPerYear = game.settings.get(MODULE, MONTHS_PER_YEAR) ?? 12;
    const extraDaysPerYear = game.settings.get(MODULE, EXTRA_DAYS_PER_YEAR) ?? 1;

    SECONDS["IN_ONE_WEEK"] = SECONDS.IN_ONE_DAY * daysPerWeek;
    SECONDS["IN_TWO_WEEKS"] = SECONDS.IN_ONE_WEEK * 2;
    SECONDS["IN_ONE_MONTH"] = SECONDS.IN_ONE_WEEK * weeksPerMonth;
    SECONDS["IN_TWO_MONTHS"] = SECONDS.IN_ONE_MONTH * 2;
    SECONDS["IN_ONE_YEAR"] = SECONDS.IN_ONE_MONTH * monthsPerYear + SECONDS.IN_ONE_DAY * extraDaysPerYear;
    SECONDS["IN_TWO_YEARS"] = SECONDS.IN_ONE_YEAR * 2;

    const { remainingSeconds, turns } = effect;

    let string = "";
    let qty = 1;


    if (remainingSeconds == Infinity && turns) {
      if (turns == 1) string = "TURN";
      else {
        qty = turns;
        string = "TURNS";
      }
    } else if (remainingSeconds == Infinity) {
      string = "UNLIMITED";
    } else if (remainingSeconds >= SECONDS.IN_TWO_YEARS) {
      qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_YEAR);
      string = "YEARS";
    } else if (remainingSeconds >= SECONDS.IN_ONE_YEAR) {
      string = "YEAR";
    } else if (remainingSeconds >= SECONDS.IN_TWO_MONTHS) {
      qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_MONTH);
      string = "MONTHS";
    } else if (remainingSeconds >= SECONDS.IN_ONE_MONTH) {
      string = "MONTH";
    } else if (remainingSeconds >= SECONDS.IN_TWO_WEEKS) {
      qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_WEEK);
      string = "WEEKS";
    } else if (remainingSeconds >= SECONDS.IN_ONE_WEEK) {
      string = "WEEK";
    } else if (remainingSeconds >= SECONDS.IN_TWO_DAYS) {
      qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_DAY);
      string = "DAY";
    } else if (remainingSeconds >= SECONDS.IN_TWO_HOURS) {
      qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_HOUR);
      string = "HOURS";
    } else if (remainingSeconds >= SECONDS.IN_TWO_MINUTES) {
      qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_MINUTE);
      string = "MINUTES";
    } else if (remainingSeconds >= SECONDS.IN_ONE_MINUTE) {
      string = "MINUTE";
    } else if (remainingSeconds >= 2) {
      qty = remainingSeconds;
      string = "SECONDS";
    } else if (remainingSeconds === 1) {
      string = "SECOND";
    } else {
      string = "EXPIRED";
    }

    return game.i18n.format(`VISUAL_ACTIVE_EFFECTS.TIME.${string}`, { qty });
  });
}

export function _renderEditor(effect) {
  const editor = Object.values(effect.apps).find(e => e instanceof VisualActiveEffectsEditor);
  if (editor) return editor.render();
  return new VisualActiveEffectsEditor(effect, {
    title: game.i18n.format("VISUAL_ACTIVE_EFFECTS.EDITOR_TITLE", { id: effect.id })
  }).render(true);
}
