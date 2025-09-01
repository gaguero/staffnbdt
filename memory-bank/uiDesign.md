# UI Design System

## Brand-Aligned Visual Language (Nayara Example)

This style guide translates brand books into a functional UI framework with white-label variables.

### Color Palette
- Primary: Sand Beige `#F5EBD7`, Warm Gold `#AA8E67`
- Neutrals: Charcoal `#4A4A4A`
- Accents: Forest Green `#7C8E67`, Ocean Teal `#A4C4C8`, Sky Blue `#DCFEF4`, Terracotta `#EC6C4B`, Soft Lilac `#DCCEDC`, Deep Aqua `#6A8ECF`

### Typography
- Heading: Gotham Black (fallback: Tahoma Bold)
- Subheading: Georgia Italic
- Body: Proxima Nova (fallback: Arial)

### Layout & Navigation
- 12-column responsive grid, fixed top nav, bold headers + muted subtext

### Components
- Buttons: rounded 12–16px; primary = warm gold; secondary = charcoal outline
- Cards: rounded 16–20px; soft shadow; generous padding
- Forms: full-width inputs, 8px radius, subtle borders; clear active/invalid states

### Motion & Feedback
- 200–300ms transitions; subtle hover scale; success/error/info color semantics

### Accessibility
- WCAG AA contrast, min font sizes, alt text, full keyboard navigation

### CSS Variable Mapping (White-Label)
```css
:root {
  /* Colors */
  --brand-primary: #AA8E67;
  --brand-text-primary: #4A4A4A;
  /* Radii */
  --brand-radius-sm: .5rem; --brand-radius-md: .75rem; --brand-radius-lg: 1rem;
  /* Shadows */
  --brand-shadow-soft: 0 2px 15px -3px rgba(0,0,0,.07);
}
```

### Brand-Aware Utilities
```css
@layer components {
  .bg-brand-primary { background: var(--brand-primary); }
  .text-brand-primary { color: var(--brand-text-primary); }
}
```

## UX Improvements Summary (Completed)

All 15 UX enhancements implemented (Aug 21, 2025):
- Real-time validation, standardized feedback, skeleton loaders
- Breadcrumbs; enhanced pagination; bulk ops; exports; inline edits
- Advanced search; filter combinations; interactive stats; contextual modal actions
- Quick-assign dropdowns; templates; advanced search operators/query builder

## White-Label Branding System

Production-ready Brand Studio with real-time theme switching using CSS variables, org/property hierarchy resolution, and accessibility validation. See detailed architecture in `memory-bank/systemPatterns.md` and API/UI specifics in the branding implementation guide entries in `activeContext.md`.

## Concierge Ops Views (v1)

### Reservation 360
- Header with reservation/guest summary
- Required-items checklist (from Playbooks)
- Quick-create from templates
- Exception panel for missing requirements and SLAs

### Guest Timeline
- Chronological log of Concierge Objects, notes, files, notifications
- Filters by type/status/date

### Today Board
- Due/overdue/upcoming sections
- Bulk nudge/reassign actions
- Mobile-first column stack

## Vendor Portal (Magic-Link)
- Minimal, focused UI for confirm/decline with optional notes/ETA
- Brand-aligned minimal styling; responsive first
- Clear status feedback and expiry messaging


