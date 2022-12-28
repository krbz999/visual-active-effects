# Visual Active Effects
Visualize your active effects.

While the module is enabled, all temporary effects (including status conditions) affecting your current token will be displayed in the top right.
* Double-clicking an effect will toggle it between enabled and disabled.
* Right-clicking an effect will let you delete it.

The below video demonstrates how to use it and how it looks, using an effect created by the module Concentration Notifier as an example.

[Visual Active Effects](https://i.imgur.com/Qs8elyp.mp4)

The text in the effects support two parts: the intro and the content. Structure the effect data like this:

```js
actor.createEmbeddedDocuments("ActiveEffect", [{
  icon: "icons/magic/holy/yin-yang-balance-symbol.webp",
  label: "Visual Active Effect",
  duration: { seconds: 60 },
  "flags.visual-active-effects.data": {
    intro: "This is some short text.",
    content: `
    <p>Some much longer text here.</p>
    <p>In multiple paragraphs.</p>
    <p>It can be as long as I want.</p>
    <p>Because if it overflows, a scroll wheel will appear.</p>
    <p>Besides, this entire section is collapsible.</p>`
  }
}]);
```
As a fallback, the text will default to `flags.convenientDescription` for users using DFred's Convenient Effects. You can also edit all these properties, and more, in the header of an Active Effect (click the Pen icon).

# Module and System Requirements
None.

# Settings
You can change the pixel size (default 50px) of the icons and the font size (default 16px) of the text; the width of the panels will scale accordingly, and you can change the top offset of the panel itself. You can also optionally show passive and disabled effects, as well as adjust the time units to suit your needs.
