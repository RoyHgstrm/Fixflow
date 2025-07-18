# 🎨 FixFlow UI Style Guidelines

This document defines the design and styling conventions for all UI in the FixFlow SaaS platform. It ensures consistency, modern aesthetics, mobile responsiveness, and accessibility across every screen and component.

---

## 🌟 Design Philosophy

FixFlow's UI should feel:

- **Modern & Minimal** – Clean, purposeful layouts with generous spacing and sharp typography.
- **Mobile-First** – Designed for small screens first, with responsive breakpoints and gestures.
- **Accessible** – Fully keyboard-navigable, WCAG-compliant, semantic HTML.
- **Scalable** – Modular components with predictable structure and reusable patterns.
- **Dark Mode Friendly** – Support only dark theme

---

## 🧱 UI Foundations

### ⚙️ Frameworks & Libraries

- **Tailwind CSS v4.1+** – Utility-first styling framework
- **shadcn/ui** – Headless UI components styled with Tailwind
- **Radix UI** – Accessible component primitives under shadcn
- **Lucide Icons** – Consistent, modern iconography

---

## 🎨 Design Tokens

Defined in `tailwind.config.ts` and used across all components:

- **Colors**
  - `primary`: Emerald (default)
  - `accent`: Blue (used sparingly)
  - Use Tailwind’s `slate` for grays
  - Dark mode only
- **Typography**
  - Font: `Inter`, `sans-serif`
  - Font sizes: `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, etc.
- **Spacing**
  - Use `space-x-*`, `space-y-*` and consistent padding/margin (multiples of 4)
- **Radius**
  - Use `rounded-lg` or `rounded-2xl` for soft, modern edges
- **Shadow**
  - Use `shadow-sm` or `shadow-md` only for interactive elements

---

## 🧩 Component Conventions

### ✅ Use shadcn/ui First

Use `shadcn/ui` components as a base. Only create a custom UI component when:

- No base component fits the need
- You require highly branded, unique UI
- The component has significant domain logic

### 🔧 Custom Components

Place in `packages/ui`. Follow these rules:

- Filename: `ComponentName.tsx`
- Must support:
  - `className` override
  - Forwarded `ref` if applicable
  - dark mode by default
- Typed with `React.FC<Props>` and props Zod schema if applicable

### 📚 Examples

```tsx
// Good: Button
<Button variant="outline" className="w-full md:w-auto">Save</Button>

// Good: Card layout
<Card className="p-6 space-y-4 bg-background shadow-sm rounded-xl" />

// Bad: Inline styles ❌
<div style="padding: 12px; color: red">Don't do this</div>


