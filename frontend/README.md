# Aspace Frontend (Marketing Site)

This is the marketing landing page for Aspace, built with React, TypeScript, Vite, and Tailwind CSS.

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 3.4
- Framer Motion (animations)
- Lucide React (icons)

## Scripts

```bash
npm run dev       # Start development server on http://localhost:3000
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Development

The marketing site is a static React application showcasing the Aspace platform, featuring animated sections, responsive design, and a modern dark theme.

It links to the DApp (dashboard) at `http://localhost:5173` when "Launch DApp" is clicked.

## Configuration

No special configuration needed. The site uses Tailwind CSS with custom color palette defined in `tailwind.config.js`.

## Structure

- `src/components/` - Reusable UI components (Header, Hero, Features, HowItWorks, CTA, Footer, Logo)
- `src/App.tsx` - Main layout
- `src/main.tsx` - React entry point
- `src/index.css` - Global styles + Tailwind imports

All styling is utility-first via Tailwind with some custom CSS for animations.
