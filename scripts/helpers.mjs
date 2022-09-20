import { DAYS_PER_WEEK, EXTRA_DAYS_PER_YEAR, MODULE, MONTHS_PER_YEAR, WEEKS_PER_MONTH } from "./constants.mjs";

// create the needed objects of effect data for the effect panel, sorted into enabled/disabled arrays.
export async function getEffectData(actor){
    const enabledEffects = [];
    const disabledEffects = [];

    const effects = getTemporaryEffects(actor);

    // set up enable effects.
    for ( const eff of effects ) {
        const desc = foundry.utils.getProperty(eff, "flags.convenientDescription");
        const { intro, header, contents } = eff.getFlag(MODULE, "data") ?? {};

        const { _id, icon, label, isTemporary, isExpired, remainingSeconds, turns, disabled } = eff;
        const effect = { _id, icon, label, isTemporary, isExpired, remainingSeconds, turns };

        if ( intro && contents ) {
            effect.strings = {
                intro: await TextEditor.enrichHTML(intro, { async: true }),
                header: header ?? game.i18n.localize("VISUAL_ACTIVE_EFFECTS.LABELS.DETAILS"),
                contents: await TextEditor.enrichHTML(contents, { async: true })
            }
        } else if ( desc ) {
            effect.desc = await TextEditor.enrichHTML(desc, { async: true });
        }
        
        if ( disabled ) disabledEffects.push(effect);
        else enabledEffects.push(effect);
    }
    return { enabledEffects, disabledEffects };
}

// gets all of an actor's temporary effects, sorted, with some appended info.
function getTemporaryEffects(actor){
    if ( !actor ) return [];

    return actor.effects.map((effect) => {
        const effectData = effect.clone({}, { keepId: true });
        effectData.remainingSeconds = getSecondsRemaining(effectData.duration);
        effectData.turns = effectData.duration.turns;
        effectData.isExpired = effectData.remainingSeconds <= 0;
        return effectData;
    }).filter(effectData => {
        return effectData.isTemporary;
    }).sort((a, b) => {
        if ( a.isTemporary ) return -1;
        if ( b.isTemporary ) return 1;
        return 0;
    });
}

function getSecondsRemaining(duration){
    if ( duration.seconds || duration.rounds ) {
        const seconds = duration.seconds ?? duration.rounds * (CONFIG.time.roundTime ?? 6);
        return duration.startTime + seconds - game.time.worldTime;
    } else return Infinity;
}

// Registers the handlebar helpers
export function registerHelpers(){
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

        
        if ( remainingSeconds == Infinity && turns ) {
            if ( turns == 1 ) string = "TURN";
            else {
                qty = turns;
                string = "TURNS";
            }
        } else if ( remainingSeconds == Infinity ) {
            string = "UNLIMITED";
        } else if ( remainingSeconds >= SECONDS.IN_TWO_YEARS ) {
            qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_YEAR);
            string = "YEARS";
        } else if ( remainingSeconds >= SECONDS.IN_ONE_YEAR ) {
            string = "YEAR";
        } else if ( remainingSeconds >= SECONDS.IN_TWO_MONTHS ) {
            qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_MONTH);
            string = "MONTHS";
        } else if ( remainingSeconds >= SECONDS.IN_ONE_MONTH ) {
            string = "MONTH";
        } else if ( remainingSeconds >= SECONDS.IN_TWO_WEEKS ) {
            qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_WEEK);
            string = "WEEKS";
        } else if ( remainingSeconds >= SECONDS.IN_ONE_WEEK ) {
            strin = "WEEK";
        } else if ( remainingSeconds >= SECONDS.IN_TWO_DAYS ) {
            qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_DAY);
            string = "DAY";
        } else if ( remainingSeconds >= SECONDS.IN_TWO_HOURS ) {
            qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_HOUR);
            string = "HOURS";
        } else if ( remainingSeconds >= SECONDS.IN_TWO_MINUTES ) {
            qty = Math.floor(remainingSeconds / SECONDS.IN_ONE_MINUTE);
            string = "MINUTES";
        } else if (remainingSeconds >= SECONDS.IN_ONE_MINUTE ) {
            string = "MINUTE";
        } else if ( remainingSeconds >= 2 ) {
            qty = remainingSeconds;
            string = "SECONDS";
        } else if ( remainingSeconds === 1 ) {
            string = "SECOND";
        } else {
            string = "EXPIRED";
        }

        return game.i18n.format("VISUAL_ACTIVE_EFFECTS.TIME." + string, { qty });
    });

    Handlebars.registerHelper("paragraphy", (string) => {
        if ( string.trim().startsWith("<p") ) {
            return string;
        }
        return string.split("\n").map(i => {
            return i.trim();
        }).filter(i => {
            return !!i;
        }).reduce((acc, e) => {
            return acc + `<p>${e}</p>`;
        }, "");
    });
}

export function collapsibleSetup(){
    document.addEventListener("click", (event) => {
        const t = event.target.closest(".visual-active-effects .collapsible-header");
        if ( !t ) return;
        t.closest(".collapsible").classList.toggle("active");
    });
}