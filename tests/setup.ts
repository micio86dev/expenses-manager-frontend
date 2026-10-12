import { enableAutoUnmount } from '@vue/test-utils'
import { afterEach } from 'vitest'

// Components are attached to document.body (axe needs a real tree); unmount them after each test.
enableAutoUnmount(afterEach)
