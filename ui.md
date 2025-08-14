# Nayara Bocas del Toro – UX/UI Style Guide

## 1. Visual Identity Alignment

This style guide translates the **Nayara Resorts Brand Book** into a functional digital UI framework, ensuring brand consistency across web and mobile applications.

---

## 2. Color Palette

Nayara’s muted yet elegant tones should be applied systematically to UI components.

### Primary Colors

* **Sand Beige**: #F5EBD7
* **Charcoal Gray**: #4A4A4A
* **Warm Gold**: #AA8E67
* **Forest Green (Tented Camp)**: #7C8E67
* **Ocean Teal (Springs)**: #A4C4C8
* **Sky Blue (Gardens)**: #DCFEF4

### Accent Colors

* **Terracotta (Alto Atacama)**: #EC6C4B
* **Soft Lilac (Hangaroa)**: #DCCEDC
* **Deep Aqua (Bocas Bali)**: #6A8ECF

### Application Guidelines

* **Backgrounds**: use light beige or sand tones.
* **Text**: default charcoal gray with gold or terracotta for emphasis.
* **Call-to-Action Buttons**: use warm gold or forest green with white text.
* **Hover/Active States**: darken the base color by 10–15%.

---

## 3. Typography

### Heading Font

* **Gotham Black** (all caps, bold)
  Usage: Page titles, section headers.

### Subheading Font

* **Georgia Italic** (sentence or title case only)
  Usage: Subtitles, contextual notes, feature highlights.

### Body Font

* **Proxima Nova** (light, regular, semi-bold)
  Usage: All main body content, buttons, navigation, and forms.

### Web Safe Alternatives

* Headings: Tahoma Bold
* Subheadings: Georgia Italic
* Body: Arial Regular

---

## 4. Layout & Navigation

* **Grid System**: 12-column responsive grid with generous whitespace.
* **Navigation**: fixed top navigation bar with clean background and active state highlighting.
* **Hierarchy**: bold headers + muted subtext for cognitive clarity.
* **Content-first**: layouts must prioritize usability, reducing unnecessary decorative elements.

---

## 5. Components

### Buttons

* Rounded corners (12–16px)
* Primary (filled): Warm Gold background, white text.
* Secondary (outline): Charcoal border, charcoal text.
* Hover: slight scale-up animation (Framer Motion) with subtle shadow.

### Cards

* Rounded corners (16–20px)
* Soft shadow for elevation.
* Padding: 24px minimum.
* Include thumbnail, title, description.

### Forms

* Input fields: full-width, 8px rounded corners, subtle border (#E0E0E0).
* Active state: border highlights with accent color.
* Labels: Proxima Nova, semi-bold.

### Document Library

* Grid of cards (thumbnails of PDFs/images).
* Hover state: preview summary overlay.
* Download button: gold primary button.

---

## 6. Motion & Feedback

* **Transitions**: 200–300ms ease-in-out.
* **Navigation changes**: fade + slide.
* **Hover effects**: color shift + subtle scaling.
* **Feedback states**: success (green), error (terracotta), info (teal).

---

## 7. Accessibility

* **Contrast Ratios**: meet WCAG AA.
* **Font Sizes**: min 14px body, 20px subheadings, 28px+ headers.
* **Alt Text**: mandatory for all media.
* **Keyboard Navigation**: all interactive elements accessible.

---

## 8. Example Use Cases

1. **Payroll Dashboard**: beige background, gold-highlighted tabs, Proxima Nova text.
2. **Training Session Module**: card layout with thumbnails for videos, PDFs, links.
3. **Commercial Benefits Page**: grid of partner logos, hover preview with discount details.
4. **Manager Admin Panel**: darker sidebar for navigation, gold accents for action buttons.

---

## 9. Inspiration Notes

The brand book highlights the importance of muted tones, elegant typography, and a content-first approach. The UI should feel immersive yet lightweight, reflecting **luxury simplicity**.

---

## 10. Next Steps

* Build a Figma component library using these guidelines.
* Create dark-mode adaptation using deeper tones from brand palette.
* Develop Tailwind theme configuration mapping colors and typography.
