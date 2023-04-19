# Visual Active Effects
Visualize your active effects.

While the module is enabled, all temporary effects (including status conditions) affecting your current token will be displayed in the top right.
* Double-clicking an effect will toggle it between enabled and disabled.
* Right-clicking an effect will let you delete it. A GM can shift-right-click an effect for quick deletion.
* Ctrl-double-clicking an effect will open its config.

The below video demonstrates how to use it and how it looks, using an effect created by the module Concentration Notifier as an example.

[Visual Active Effects](https://i.imgur.com/Qs8elyp.mp4)

You can edit all the text properties, and more, in the header of an ActiveEffect (click the Pen icon).

## Module and System Requirements
None.

## For Module Developers
Visual Active Effects supports adding your own buttons into the descriptions. You can hook into the template data creation using the hook `"visual-active-effects.createEffectByttons"` and push your button to the array. Example that creates a toggle button in a description, only if the effect is labeled 'Steve':
```js
Hooks.on("visual-active-effects.createEffectButtons", function(eff, buttons){
  if (eff.label === "Steve") {
    buttons.push({
      label: "Toggle",
      callback: function(){
        eff.update({disabled: !eff.disabled});
      }
    });
  }
});
```
