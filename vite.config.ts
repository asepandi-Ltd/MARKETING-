import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function suppressHmrPlugin(): Plugin {
  return {
    name: 'suppress-hmr-client',
    enforce: 'post',
    transform(code: string, id: string) {
      if (id.includes('@vite/client') || id.includes('client.mjs') || id.includes('bundledDevClient.mjs')) {
        return code
          .replaceAll('await wsTransport.connect(handlers);', '/* suppressed hmr ws connection */')
          .replaceAll(/console\.error\(`\[vite\] failed to connect to websocket[^\`]*`\);?/g, '/* silenced */');
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [suppressHmrPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio to prevent WebSocket connection errors in cloud sandbox
      hmr: false,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
