# DESIGN_SYSTEM.md

## Visual Direction
High-contrast minimalist/editorial. Cream background, charcoal primary, bold headings, generous spacing, rounded cards, clear prayer status states.

## Colors
- Background: `#f4f1ea`
- Primary/Charcoal: `#333333`
- Black: `#000000`
- Animation Shutter: `#1a1a1a`
- Cream Text: `#f4f1ea`
- Primary Text: `text-slate-900`
- Secondary Text: `text-slate-500`
- Placeholder Text: `text-slate-400`
- Borders: `border-[#333]`, `border-[#333]/10`, `border-[#333]/20`

## Semantic Colors
Completed uses charcoal, not bright green. Qaza uses subtle amber. Errors use red only for real errors.

## Typography
- Brand/headings: Titan One, `text-2xl` to `text-4xl`, tracking-tight, leading-none.
- Body/inputs: system font-sans, `text-sm`, `text-base`.
- Labels: uppercase, font-bold, text-xs/text-[10px], tracking-wider/widest.

## Spacing/Radius
Screen padding `p-6`. Section spacing `space-y-5/6`. Cards `p-5/6`. Buttons `py-3.5 px-5`. Buttons/rows `rounded-2xl`, cards `rounded-3xl`, avatars `rounded-full`.

## Buttons
Primary solid: `bg-[#333] text-[#f4f1ea] py-3.5 px-5 rounded-2xl font-bold`.
Primary outline: `bg-transparent border-2 border-[#333] text-[#333] py-3.5 px-5 rounded-2xl font-bold`.
Text link: `text-xs font-bold text-slate-900`.

## Cards
Solid card: `bg-[#333] p-6 rounded-3xl text-[#f4f1ea] shadow-lg`.
Outline card: `border-2 border-[#333] p-5 rounded-3xl bg-transparent`.
Muted card: `bg-[#333]/5 border border-[#333]/10 p-6 rounded-3xl`.
Interactive row: `bg-white/50 border border-[#333]/20 p-4 rounded-2xl`.

## Inputs
Text fields: transparent with bottom border. Avoid boxed inputs unless needed. Selectors use interactive row/card style.

## Status Badges
Prayed: charcoal fill. Available: transparent charcoal border. Locked: muted gray. Qaza: amber. Not completed: red subtle.

## Home Design
Only two major sections: Big Next / Current Prayer Card and Today’s Prayer List. Do not overcrowd with analytics.

## App Opening Animation
“Staircase Down”: charcoal `#1a1a1a`; typewriter NamazMate, 80ms/letter; pill cursor; 600ms hold; 6 vertical columns slide down with 50ms stagger; text exits after 120ms; cubic-bezier `(0.76, 0, 0.24, 1)` over 0.8s; reveal cream auth screen. Run only on cold open; respect reduced motion.

## Copywriting
Calm, encouraging, respectful. Use “May Allah accept your prayers.” Avoid shame wording like “failed” or “missed again.”

## Accessibility
44px touch targets, strong contrast, status text/icons not color only, reduced motion support, accessibility labels for icon-only buttons.
