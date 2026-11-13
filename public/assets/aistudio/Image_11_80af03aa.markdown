---
name: Nocturne Cinema
colors:
  surface: '#141315'
  surface-dim: '#141315'
  surface-bright: '#3a393b'
  surface-container-lowest: '#0f0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f21'
  surface-container-high: '#2b292c'
  surface-container-highest: '#363436'
  on-surface: '#e6e1e4'
  on-surface-variant: '#d7c4ad'
  inverse-surface: '#e6e1e4'
  inverse-on-surface: '#313032'
  outline: '#9f8e79'
  outline-variant: '#524533'
  surface-tint: '#ffba4b'
  primary: '#ffd59b'
  on-primary: '#442b00'
  primary-container: '#ffb020'
  on-primary-container: '#6b4600'
  inverse-primary: '#815600'
  secondary: '#ffb4a4'
  on-secondary: '#621002'
  secondary-container: '#852916'
  on-secondary-container: '#ff9f8b'
  tertiary: '#ffd3b6'
  on-tertiary: '#4c2709'
  tertiary-container: '#efb38a'
  on-tertiary-container: '#6f4423'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb1'
  primary-fixed-dim: '#ffba4b'
  on-primary-fixed: '#291800'
  on-primary-fixed-variant: '#624000'
  secondary-fixed: '#ffdad3'
  secondary-fixed-dim: '#ffb4a4'
  on-secondary-fixed: '#3e0500'
  on-secondary-fixed-variant: '#822714'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#f7ba90'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#663d1d'
  background: '#141315'
  on-background: '#e6e1e4'
  surface-variant: '#363436'
typography:
  display-tv:
    fontFamily: Outfit
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 68px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 50px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-sm:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '400'
    lineHeight: 32px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  label-lg:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Outfit
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 2rem
  gutter-tv: 3rem
  margin: 3.5rem
  margin-tv: 5rem
  space-xs: 0.5rem
  space-sm: 1rem
  space-md: 1.5rem
  space-lg: 2.25rem
  space-xl: 3.5rem
---

## Brand & Style

This design system delivers an immersive, distraction-free leanback entertainment interface crafted for the 10-foot living room experience at night. Engineered with strict circadian sensitivity, the system eliminates harsh cool spectrums and disruptive screen glare, curating a calming cinematic atmosphere that respects the viewer's evening physiology.

The aesthetic fuses **Cinematic Minimalism** with **Atmospheric Tactility**. Visual elements feel grounded, soft-edged, and dimly radiant—reminiscent of amber projection lamps, velvet theater seating, and twilight projection rooms. Surfaces recede cleanly into OLED-grade deep warm charcoals, directing total optical focus to video content while subtle candlelight glows cleanly signify active remote control navigation.

## Colors

The palette is anchored by deep warm blacks and glowing, biological-friendly warm accents:

- **Primary (`#ffb020` / Warm Amber Gold):** The primary focus state and active element indicator. Emits an amber flame-like luminance that is instantly identifiable from 10 feet away without emitting stimulating blue wavelengths.
- **Secondary (`#e06c53` / Muted Coral Crimson):** Reserved for live status tags, badges, media playback progress indicators, and subtle alerts.
- **Tertiary (`#a3704c` / Burnished Umber):** Used for inactive toggle tracks, secondary highlights, and contextual metadata separators.
- **Neutral (`#121113` / Deep Warm Charcoal):** The foundational canvas. Blends into deep OLED blacks (`#0b0b0c`) for backdrops, with warm-tinted step-up values for surface containers (`#19171b`, `#232026`).

Text and iconography use an anti-glare warm off-white (`#f3ede2`) and muted parchment (`#a89f91`), completely avoiding pure daylight whites (#ffffff) to prevent pupillary strain in darkened rooms.

## Typography

Typography is calibrated specifically for legibility across 10-foot distances against dark environments. 

**Outfit** serves as the display and label typeface; its geometric curves and open apertures maintain instant legibility even with peripheral vision or screen glow. **Plus Jakarta Sans** provides smooth, warm, and highly readable body text for synopsis blurbs, episode descriptions, and actor credits.

Type sizes are scaled up from traditional web/mobile conventions—nothing drops below `13px`, and standard UI labels remain at `16px–20px` to eliminate squinting. Line heights are comfortably generous to prevent optical vibration against pitch-dark backings.

## Layout & Spacing

The layout is built around an overscan-safe, fluid horizontal rail and grid architecture:

- **Overscan Margins:** The root interface enforces a mandatory 5rem (80px) outer edge margin across 4K/1080p outputs to accommodate TV panel clipping and edge illumination bleeding.
- **Horizontal Carousels:** Content shelves utilize consistent 3rem (48px) gutters between posters and 3.5rem (56px) vertical spacing between swimlanes.
- **D-Pad Snap Architecture:** Elements strictly align to a directional axis. Focus rings never jump erratically; cards and buttons conform to balanced multi-column structures (5-column media rails or 3-column detail views) ensuring predictable directional remote navigation.

## Elevation & Depth

Visual hierarchy does not rely on harsh dropshadows or stark white outlines. Instead, it utilizes **Tonal Stratification** paired with **Candlelight Ambient Blooms**:

1. **Base Layer (`#0b0b0c`):** Deepest level, utilized for the root canvas and dimmed letterboxes.
2. **Resting Surfaces (`#161518` with 1px border `#2a262c`):** Unfocused cards, modal frames, and toolbars live here.
3. **Elevated Surface (`#211e24`):** Flyout drawers, audio settings panels, and context menus.
4. **Focused / Active Element:** The focused UI component scales smoothly to 1.05x, receives a warm 2px `#ffb020` rim highlight, and emits a diffused candlelight glow (`0 8px 32px rgba(245, 158, 11, 0.25)`). Unfocused neighboring elements dim to 70% opacity, providing unambiguous location confirmation across the room.

## Shapes

The interface embraces a balanced, friendly curvature with standard corner radiuses set to 0.5rem (8px), scaling to 1rem (16px) for movie poster tiles and large cards. 

Pill-shaped containers are exclusively used for contextual tags (e.g., "4K HDR", "Dolby Atmos") and primary action buttons, signaling clear tap/click affordability. Sharp 90-degree corners are completely avoided to reduce harsh geometric contrast in dark rooms.

## Components

### Buttons & Action Controls
- **Default State:** Transparent background, subtle warm-gray border (`#35303a`), warm off-white text (`#f3ede2`).
- **Focus State:** Solid warm amber gold (`#ffb020`) fill with pitch charcoal text (`#0b0b0c`), accompanied by a soft amber diffusion glow.
- **Secondary / Ghost:** Soft warm dark tint (`#221f26`) with parchment text.

### Media Cards & Posters
- **Dimensions:** Standard 2:3 vertical poster cards or 16:9 episodic cards.
- **Focus Transition:** Expands to 1.05x scale via a 200ms ease-out curve. A 2px amber border highlights the perimeter, revealing subtitle details and a muted coral crimson progress bar at the lower boundary.

### Chips & Metadata Badges
- Compact pill-shaped pills with `#201d22` background and tertiary `#d1976a` or secondary `#e06c53` text for content ratings, video audio codecs, and playback timestamps.

### Lists & Navigation Rails
- Vertical left-hand menu rails default to icon-only with 40% opacity warm text. Upon navigating focus onto the rail, it expands smoothly horizontally without obscuring central content, shifting focused icons to `#ffb020`.

### Form Controls & Settings Toggles
- **Toggles:** Warm charcoal oval track; switch thumb illuminates into warm candlelight gold when toggled ON.
- **Sliders (Audio/Brightness):** Horizontal track in `#2c2832` with an active fill of `#ffb020`. The cursor thumb expands into an illuminated amber bead when controlled.