import { defineConfig } from 'vite';
const base = process.env.GITHUB_PAGES === 'true' ? `/${process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''}/` : '/';
export default defineConfig({ base, build:{outDir:'dist'} });
