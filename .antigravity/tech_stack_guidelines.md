# Tech Stack Guidelines

## Core Stack
- **Frontend Core**: React 19, TypeScript
- **Routing & SSR**: TanStack Router + TanStack Start (file-based routing under `src/routes/`)
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS v4 (configured via `@import "tailwindcss"` in `src/styles.css`, using OKLCH colors, inline theme extension)
- **State Management**: `@tanstack/react-query`
- **Forms & Validation**: `react-hook-form` + `zod`
- **UI Primitives**: Radix UI
- **Icons**: `lucide-react`
- **Backend Core**: Spring Boot 3, Java

## Routing & Directory structure
- Page routes are located in `src/routes/`.
- Routes beginning with `_app.` are protected routes rendered within the main app layout.
- Styling tokens are defined as OKLCH CSS variables in `src/styles.css`.
