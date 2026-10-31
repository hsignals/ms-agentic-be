// Application migration generation excludes Mastra-owned tables.

import { defineConfig } from 'drizzle-kit';

export default defineConfig({ dialect: 'postgresql', schema: './src/db/schema/index.ts', out: './drizzle' });
