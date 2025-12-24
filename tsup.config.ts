import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node20',
    outDir: 'dist',
    clean: true,
    splitting: false,
    sourcemap: true,
    dts: false,
    // This is important - resolve path aliases
    esbuildOptions(options) {
        options.alias = {
            '@': './src',
        };
    },
    // Mark external packages that shouldn't be bundled
    external: [
        'express',
        'mongodb',
        'firebase-admin',
        'bcrypt',
        'jsonwebtoken',
        'cors',
        'helmet',
        'compression',
        'cookie-parser',
        'morgan',
        'stripe',
        'zod',
        'dotenv',
        'express-validator',
    ],
    // Keep these files as external (don't bundle)
    noExternal: [],
    banner: {
        js: '// Bundled with tsup',
    },
});
