import { collapsibleSetup, registerHelpers } from "./scripts/helpers.mjs";
import { registerSettings } from "./scripts/settings.mjs";
import { VisualEffects } from "./scripts/visual-active-effects.mjs";

Hooks.once("init", () => {
    console.log("ZHELL | Initializing Visual Active Effects");
});

Hooks.once("setup", registerSettings);

Hooks.once("ready", async function(){
    registerHelpers();
    const panel = new VisualEffects();
    await panel.render(true);
    Hooks.on("collapseSidebar", panel.handleExpand);
    
    for ( const hook of [
        "updateWorldTime", "createActiveEffect",
        "updateActiveEffect", "deleteActiveEffect",
        "controlToken", "preUpdateToken"
    ] ) {
        Hooks.on(hook, () => panel.refresh());
    }

    collapsibleSetup();
});
