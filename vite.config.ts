import { defineConfig } from 'vite';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  base: process.env.CAPACITOR_BUILD === '1'
    ? './'
    : process.env.GITHUB_ACTIONS
      ? '/fla-viewer-updver/'
      : '/',
  plugins: [{
    name: 'mobile-and-library-tools',
    transformIndexHtml(html) {
      const withBootstrap = html.replace(
        '<script type="module" src="/src/main.ts"></script>',
        '<script type="module" src="/src/asset-browser-bootstrap.ts"></script>\n  <script type="module" src="/src/main.ts"></script>'
      );
      return withBootstrap.replace(
        '</body>',
        '  <script type="module" src="/src/mobile-transport.ts"></script>\n</body>'
      );
    },
  }],
  server: { port: 3000 },
  optimizeDeps: { include: ['mp4-muxer'] },
  assetsInclude: ['**/*.gz'],
  build: { target: 'esnext' },
  test: {
    globals: true,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/__tests__/**', 'src/edge-test.ts'],
    },
    include: ['src/**/*.test.ts', 'src/__tests__/**/*.test.ts'],
  },
});
