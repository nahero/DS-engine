import * as React from "react"

import type { Brand, Density, DisplaySettings, Theme } from "@/lib/use-display-settings"

// Story helper: same shape as useDisplaySettings but local state only, so it never touches <html>
// and can't fight the Storybook toolbar (theme, brand, density).
export function useMockDisplaySettings(): DisplaySettings {
  const [theme, setTheme] = React.useState<Theme>("system")
  const [brand, setBrand] = React.useState<Brand>("default")
  const [density, setDensity] = React.useState<Density>("comfortable")
  return { theme, brand, density, setTheme, setBrand, setDensity }
}
