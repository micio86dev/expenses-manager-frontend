// Lets typescript-eslint (which does not understand SFCs) resolve `.vue` imports.
// vue-tsc ignores this shim and type-checks the real component files.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
