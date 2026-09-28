import { createCn } from "cn/config"

// Class merging that knows our token-backed utility names (see docs/design-system/tokens.md).
// Without this, cn() treats text-label like a colour and drops it next to text-primary-foreground,
// and doesn't resolve rounded-control vs rounded-md. Import cn from here, never from "cn".
export const cn = createCn({
  extend: {
    theme: {
      text: ["caption", "body", "body-lg", "label", "heading-sm", "heading-md", "heading-lg", "display"],
      radius: ["inner", "control", "surface", "overlay"],
      shadow: ["raised", "overlay"],
      spacing: ["control", "row", "inset", "stack", "cell"],
    },
  },
})
