import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = join(import.meta.dirname, '..', 'src')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

const sources = walk(SRC).filter((file) => /\.(css|vue)$/.test(file))
const tokensCss = readFileSync(join(SRC, 'styles', 'tokens.css'), 'utf8')
const defined = new Set([...tokensCss.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]))

describe('design tokens', () => {
  it('defines the mineral palette', () => {
    for (const hex of ['#F2F5F4', '#E3EAE8', '#1B2427', '#0B6B72', '#A32A3A']) {
      expect(tokensCss.toUpperCase()).toContain(hex)
    }
  })

  it('defines a dark theme through prefers-color-scheme', () => {
    expect(tokensCss).toMatch(/@media \(prefers-color-scheme: dark\)/)
  })

  it('respects prefers-reduced-motion', () => {
    const base = readFileSync(join(SRC, 'styles', 'base.css'), 'utf8')
    expect(base).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
  })

  it('declares the font with font-display swap', () => {
    const fonts = readFileSync(join(SRC, 'styles', 'fonts.css'), 'utf8')
    expect(fonts).toMatch(/font-display:\s*swap/)
  })

  it('defines every custom property that is used', () => {
    const missing: string[] = []
    for (const file of sources) {
      const content = readFileSync(file, 'utf8')
      for (const match of content.matchAll(/var\((--[\w-]+)/g)) {
        const name = match[1]
        if (name !== undefined && !defined.has(name)) {
          // Component-scoped properties are declared locally with the same file.
          const declaredLocally = new RegExp(`${name}\\s*:`).test(content)
          if (!declaredLocally) missing.push(`${file}: ${name}`)
        }
      }
    }
    expect(missing).toEqual([])
  })
})
