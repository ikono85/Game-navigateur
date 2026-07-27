import { defineConfig } from 'vite';

export default defineConfig({
  // Le site est servi depuis https://ikono85.github.io/Game-navigateur/ et non
  // depuis la racine du domaine : sans ce préfixe, les chemins générés pointent
  // vers /assets/... et renvoient des 404.
  base: '/Game-navigateur/',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2020',
  },
});
