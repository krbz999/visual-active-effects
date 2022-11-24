# Visual Active Effects
Visualize your active effects.

While the module is enabled, all temporary effects (including status conditions) affecting your current token will be displayed in the top right.

Double-clicking an effect will toggle it between enabled and disabled.
Right-clicking an effect will let you delete it.
The text in the effects have to be set manually in some fashion, see below.

The below video demonstrates how to use it and how it looks, using the module Concentration Notifier as an example.

[Visual Active Effects](https://i.imgur.com/Qs8elyp.mp4)

The text in the effects support two parts: the intro and the content. Structure the effect data like this (the `content` is optional):

```js
actor.createEmbeddedDocuments("ActiveEffect", [{
  icon: "icons/magic/holy/yin-yang-balance-symbol.webp",
  label: "Visual Active Effect",
  duration: { seconds: 60 },
  "flags.visual-active-effects.data": {
    intro: "This is some short text.",
    content: `
    Some much longer text here.
    In multiple paragraphs.
    It can be as long as I want.
    Because if it overflows, a scroll wheel will appear.
    Besides, this entire section is collapsible.`
  }
}]);
```
As a fallback, the text will default to `flags.convenientDescription` for users using DFred's Convenient Effects. You can also edit all these properties, and more, in the header of an ActiveEffect.

# Module Requirements
There are none, not even libwrapper.

# Settings
You can change the pixel size (default 50px) of the icons and the font size (default 16px) of the text; the width of the panels will scale accordingly.
