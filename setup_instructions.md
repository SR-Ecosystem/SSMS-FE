# Shadcn CLI, Tailwind CSS & TypeScript Setup Guide

This guide describes how to configure Shadcn UI components, Tailwind CSS, and TypeScript from scratch on this codebase structure.

---

## 1. Initializing Shadcn UI CLI
To setup the shadcn component structure in your directory:
1. Run the initialization script:
   ```bash
   npx shadcn@latest init
   ```
2. The CLI will ask configuration questions. Select the following values:
   - **Style:** Default
   - **Base color:** Slate
   - **CSS variables:** Yes
   - **Path alias for components:** `@/components`
   - **Path alias for utils:** `@/lib/utils`

### Why `/components/ui` Folder is Critical
Shadcn CLI expects component primitives (like Buttons, Dialogs, Selects) to be written under `components/ui`. Putting your base component configurations in this isolated folder keeps core primitives decoupled from your custom application/page-level features (`pages/`), maintaining modular design and clean upgrade flows.

---

## 2. Installing TypeScript
To transition this project to TypeScript for full type verification:
1. Install compiler and type definitions:
   ```bash
   npm install -D typescript @types/react @types/react-dom @types/node vite-tsconfig-paths
   ```
2. Generate the TypeScript config:
   ```bash
   npx tsc --init
   ```
3. Update `vite.config.js` to configure the React TS compiler plugin:
   ```javascript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import tsconfigPaths from 'vite-tsconfig-paths'

   export default defineConfig({
     plugins: [react(), tsconfigPaths()]
   })
   ```
4. Rename `.jsx` files to `.tsx` to enforce static type checks!

---

## 3. Installing Tailwind CSS (v4)
This codebase uses Tailwind v4 via `@tailwindcss/postcss`. To verify or fresh install:
1. Run install command:
   ```bash
   npm install tailwindcss @tailwindcss/postcss postcss autoprefixer
   ```
2. Configure PostCSS in `postcss.config.js`:
   ```javascript
   module.exports = {
     plugins: {
       '@tailwindcss/postcss': {},
       autoprefixer: {},
     }
   }
   ```
3. Inject the tailwind layer references inside the main entry stylesheet (`src/index.css`):
   ```css
   @import "tailwindcss";
   ```
