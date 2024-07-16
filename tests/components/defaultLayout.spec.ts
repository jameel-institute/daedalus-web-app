// @vitest-environment nuxt

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'

import DefaultLayout from '@/layouts/default.vue'

const stubs = {
  CIcon: true,
}

async function mockCSidebarPageloadBehavior(sidebar: VueWrapper) {
  // The CoreUI Sidebar component will emit a "hidden" event when the page loads.
  sidebar.vm.$emit('hidden')
}

describe('default layout', () => {
  describe('on smaller devices', () => {
    beforeAll(() => {
      vi.stubGlobal('innerWidth', 500)
    })

    it('initially hides the sidebar, and can open and close it from the app header', async () => {
      const component = await mountSuspended(DefaultLayout, { global: { stubs } })
      const sidebar = component.findComponent({ name: 'SideBar' })
      await mockCSidebarPageloadBehavior(sidebar)

      expect(sidebar.props('visible')).toBe(false)
      expect(sidebar.props('largeScreen')).toBe(false)

      const header = component.findComponent({ name: 'AppHeader' })
      await header.vm.$emit('toggleSidebarVisibility')
      expect(sidebar.props('visible')).toBe(true)
      expect(sidebar.props('largeScreen')).toBe(false)

      await header.vm.$emit('toggleSidebarVisibility')
      expect(sidebar.props('visible')).toBe(false)
      expect(sidebar.props('largeScreen')).toBe(false)
    })

    it('keeps the "visible" prop in sync with the state of the CSidebar component when "hidden" is emitted', async () => {
      const component = await mountSuspended(DefaultLayout, { global: { stubs } })
      const sidebar = component.findComponent({ name: 'SideBar' })
      await mockCSidebarPageloadBehavior(sidebar)

      expect(sidebar.props('visible')).toBe(false)

      const header = component.findComponent({ name: 'AppHeader' })
      await header.vm.$emit('toggleSidebarVisibility')
      expect(sidebar.props('visible')).toBe(true)

      await sidebar.vm.$emit('hidden')
      expect(sidebar.props('visible')).toBe(false)
    })

    afterAll(() => {
      vi.unstubAllGlobals()
    })
  })

  describe('on larger devices', () => {
    beforeAll(() => {
      vi.stubGlobal('innerWidth', 1500)
    })

    it('initially shows the sidebar', async () => {
      const component = await mountSuspended(DefaultLayout, { global: { stubs } })
      const sidebar = component.findComponent({ name: 'SideBar' })
      await mockCSidebarPageloadBehavior(sidebar)

      expect(sidebar.props('visible')).toBe(true)
      expect(sidebar.props('largeScreen')).toBe(true)
    })

    it('keeps the "visible" prop in sync with the state of the CSidebar component when "hidden" is emitted', async () => {
      const component = await mountSuspended(DefaultLayout, { global: { stubs } })
      const sidebar = component.findComponent({ name: 'SideBar' })
      await mockCSidebarPageloadBehavior(sidebar)

      expect(sidebar.props('visible')).toBe(true)
      expect(sidebar.props('largeScreen')).toBe(true)

      await sidebar.vm.$emit('hidden')
      expect(sidebar.props('visible')).toBe(false)
      expect(sidebar.props('largeScreen')).toBe(true)
    })

    afterAll(() => {
      vi.unstubAllGlobals()
    })
  })
})
