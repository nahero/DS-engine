import * as React from "react"

export type Theme = "light" | "dark" | "system"
export type Brand = "default" | "purple"
export type Density = "comfortable" | "compact"

export type DisplaySettings = {
  theme: Theme
  brand: Brand
  density: Density
  setTheme: (theme: Theme) => void
  setBrand: (brand: Brand) => void
  setDensity: (density: Density) => void
}

const STORAGE_KEY = "ds-display-settings"
const DARK_QUERY = "(prefers-color-scheme: dark)"

type Stored = { theme: Theme; brand: Brand; density: Density }
const DEFAULTS: Stored = { theme: "system", brand: "default", density: "comfortable" }

const THEMES: readonly Theme[] = ["light", "dark", "system"]
const BRANDS: readonly Brand[] = ["default", "purple"]
const DENSITIES: readonly Density[] = ["comfortable", "compact"]

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function read(): Stored {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Stored> | null
    return {
      theme: pick(parsed?.theme, THEMES, DEFAULTS.theme),
      brand: pick(parsed?.brand, BRANDS, DEFAULTS.brand),
      density: pick(parsed?.density, DENSITIES, DEFAULTS.density),
    }
  } catch {
    return DEFAULTS
  }
}

function write(value: Stored) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Storage can be blocked (private window, site data off); the settings still apply for this session.
  }
}

function systemPrefersDark(): boolean {
  try {
    return window.matchMedia(DARK_QUERY).matches
  } catch {
    return false
  }
}

// Same attributes `.storybook/preview.tsx` sets: `.dark` class, data-theme (brand), data-density.
function applyBrandAndDensity(brand: Brand, density: Density) {
  const root = document.documentElement
  if (brand === "default") delete root.dataset.theme
  else root.dataset.theme = brand
  if (density === "comfortable") delete root.dataset.density
  else root.dataset.density = density
}

export function useDisplaySettings(): DisplaySettings {
  const [settings, setSettings] = React.useState<Stored>(read)
  const { theme, brand, density } = settings

  // Light/dark. "system" follows prefers-color-scheme and reacts to changes.
  React.useEffect(() => {
    const root = document.documentElement
    if (theme !== "system") {
      root.classList.toggle("dark", theme === "dark")
      return
    }
    root.classList.toggle("dark", systemPrefersDark())
    let mql: MediaQueryList
    try {
      mql = window.matchMedia(DARK_QUERY)
    } catch {
      return
    }
    const onChange = (event: MediaQueryListEvent) => root.classList.toggle("dark", event.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [theme])

  React.useEffect(() => {
    applyBrandAndDensity(brand, density)
  }, [brand, density])

  const update = React.useCallback((patch: Partial<Stored>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      write(next)
      return next
    })
  }, [])

  const setTheme = React.useCallback((value: Theme) => update({ theme: value }), [update])
  const setBrand = React.useCallback((value: Brand) => update({ brand: value }), [update])
  const setDensity = React.useCallback((value: Density) => update({ density: value }), [update])

  return { theme, brand, density, setTheme, setBrand, setDensity }
}
