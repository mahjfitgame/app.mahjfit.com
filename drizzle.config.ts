// file: drizzle.config.ts

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: [
    './libs/src/**/entity.ts',
    './src/**/entity.ts',
  ],
  out: './drizzle',
});