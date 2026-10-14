import { defineConfig } from 'vite';
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = process.env.GITHUB_PAGES === 'true' ? `/${repositoryName || 'Trading-Journal'}/` : '/';
export default defineConfig({ base, build:{outDir:'dist'} });
