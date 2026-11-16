import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Regenerate the PNG icons with `npm run icons` after editing public/egg-icon.svg.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#cdeeff' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#cdeeff' } },
  },
  images: ['public/egg-icon.svg'],
})
