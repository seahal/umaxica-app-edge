/*
 * This unit's own PostCSS config, not a root one it extends: nothing in a
 * deployment unit may resolve through a repository-root file, or the unit
 * stops being extractable (`test/deployment-unit-boundaries.test.ts`).
 *
 * `@tailwindcss/postcss` is the whole pipeline. Tailwind v4 needs no
 * `tailwind.config.*` — the theme lives in `src/app/style.css` under
 * `@theme` — and no autoprefixer, which it does internally.
 */
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
