import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import birthdayConfig from './birthday.config.json'

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character]!,
  )

const [, birthMonth, birthDay] = birthdayConfig.person.birthDate
  .split('-')
  .map(Number)
const birthdayDate = `${birthMonth} 月 ${birthDay} 日`
const cakeImageUrl = new URL(
  birthdayConfig.automation.email.cakeImagePath,
  birthdayConfig.automation.email.siteUrl,
).href
const htmlReplacements = {
  __PERSON_NAME__: birthdayConfig.person.name,
  __BIRTHDAY_DATE__: birthdayDate,
  __CAKE_IMAGE_URL__: cakeImageUrl,
} as const

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'birthday-config-html',
      transformIndexHtml(html) {
        return Object.entries(htmlReplacements).reduce(
          (result, [placeholder, value]) =>
            result.replaceAll(placeholder, () => escapeHtml(value)),
          html,
        )
      },
    },
  ],
  server: { host: true, port: 5273 },
  preview: { host: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
  },
})
