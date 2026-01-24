# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Single-page wedding website for Лиза & Саша (April 25, 2026, Yekaterinburg). Uses AlpineJS for reactivity and state management.

## Development

**Run locally**: Open `index.html` directly in a browser. No build step required.

**Deploy**: Upload all files (`index.html`, `css/`, `js/`, `img/`) to any static web host.

## Architecture

### File Structure
```
/wedding/
├── index.html        # HTML with Alpine.js attributes
├── css/
│   └── styles.css    # All CSS styles
├── js/
│   └── app.js        # Alpine.js components + utilities
└── img/              # Images
```

### External Dependencies
- **Google Fonts**: Cormorant Garamond (serif), Montserrat (sans-serif), Source Code Pro (monospace)
- **AlpineJS 3.14.3**: Reactivity framework loaded via CDN
- **Google Apps Script**: RSVP form submissions stored in Google Sheets
- **Yandex Maps**: Venue location link

### Design System
CSS custom properties defined in `:root` (css/styles.css):
- `--bg-*`: Dark backgrounds (#0a0a0a, #111111, #151515)
- `--text-*`: Light text (#f5f0e8, #a89f91)
- `--accent-gold`: Primary accent (#c9a962)
- `--*-dress`: Dress code colors (black, beige, chocolate)

### AlpineJS Architecture

**Store: `$store.guest`** (js/app.js)
- `data` - Guest object from API
- `loading` - Loading state
- `fetch()` - Async data fetching
- Computed getters: `displayName`, `greeting`, `invitationTypeLabel`, `guestSectionTitle`, `partnerSectionTitle`, `isCouple`, `showAccommodation`, `showAlcohol`, `hasResponded`

**Component: `rsvpForm`** (js/app.js)
- State: `submitting`, `submitted`, `showForm`
- Form data: `attendance`, `dietary`, `accommodation`, `drinks`, `partnerDietary`, `partnerDrinks`
- Methods: `toggleNoAlcohol()`, `togglePartnerNoAlcohol()`, `isDrinkDisabled()`, `isPartnerDrinkDisabled()`, `changeResponse()`, `submit()`
- Computed: `showPartnerSection`, `showGuestSectionTitle`

**Utilities** (js/app.js)
- `toInstrumental(name)` - Russian instrumental case declension
- `toGenitive(name)` - Russian genitive case declension
- `updateParallax(event)` - Candle glow parallax effect

### Key Patterns
- **Tech theme**: Code comments, monospace fonts, programming-inspired copy
- **Scroll animations**: IntersectionObserver with `.scroll-reveal` class
- **Form handling**: Async submission with Alpine reactive state
- **Exclusive checkbox logic**: "Не пью алкоголь" disables other drink options via `isDrinkDisabled()`
- **FOUC prevention**: `[x-cloak]` hides elements until Alpine initializes

### Alpine Directives Used
| Directive | Purpose |
|-----------|---------|
| `x-data` | Component scope |
| `x-init` | Initialize (fetch guest data) |
| `x-show` | Conditional display |
| `x-text` | Text binding |
| `x-model` | Two-way form binding |
| `x-cloak` | Prevent FOUC |
| `x-transition` | Smooth show/hide |
| `@submit.prevent` | Form submission |
| `@change` | Checkbox handlers |
| `@click` | Button handlers |
| `:disabled` | Conditional disable |
| `:class` | Dynamic classes |
| `:required` | Conditional required |

### Responsive Design
Mobile breakpoint at 768px. Navigation links hidden on mobile.
