import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, localeCodes, locales, type LocaleCode } from './registry'

interface Tree {
  [key: string]: string | Tree
}

/** Flattens a nested resource into `path -> text` entries. */
function flatten(tree: Tree, prefix = ''): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [[`${prefix}${key}`, value]] : flatten(value, `${prefix}${key}.`),
  )
}

async function load(code: LocaleCode): Promise<[string, string][]> {
  const module = await locales[code].messages()
  return flatten(module.default)
}

describe('locale resources', () => {
  it('registers the default locale', () => {
    expect(localeCodes).toContain(DEFAULT_LOCALE)
  })

  it('has identical key sets for every registered locale', async () => {
    const reference = (await load(DEFAULT_LOCALE)).map(([path]) => path).sort()
    expect(reference.length).toBeGreaterThan(0)
    for (const code of localeCodes) {
      const paths = (await load(code)).map(([path]) => path).sort()
      expect(paths, `keys of "${code}"`).toEqual(reference)
    }
  })

  it('has no empty translations', async () => {
    for (const code of localeCodes) {
      for (const [path, text] of await load(code)) {
        expect(text.trim(), `"${code}" ${path}`).not.toBe('')
      }
    }
  })
})
