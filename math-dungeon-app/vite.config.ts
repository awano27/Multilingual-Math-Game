import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoPath = process.env.GITHUB_REPOSITORY?.split('/')?.[1]
const base = process.env.GITHUB_ACTIONS && repoPath ? `/${repoPath}/` : '/'

export default defineConfig({
  plugins: [react()],
  base,
})
