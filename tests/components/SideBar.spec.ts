// @vitest-environment nuxt

import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SideBar from '@/components/SideBar.vue'

const stubs = {
  CIcon: true,
}

// Reviewers - I wonder if these tests are too brittle
// (tied closely to the component's implementation / would change too often)

describe('sidebar', () => {
  it('toggles visibility based on the visible prop', async () => {
    const component = await mountSuspended(SideBar, {
      props: { visible: false, largeScreen: false },
      global: { stubs },
    })
    const coreuiSidebar = component.findComponent({ name: 'CSidebar' })
    expect(coreuiSidebar.props('visible')).toBe(false)
    await component.setProps({ visible: true })
    expect(coreuiSidebar.props('visible')).toBe(true)
  })

  it('applies unfoldable and overlaid properties when largeScreen is true', async () => {
    const component = await mountSuspended(SideBar, {
      props: { visible: true, largeScreen: true },
      global: { stubs },
    })
    const coreuiSidebar = component.findComponent({ name: 'CSidebar' })

    expect(coreuiSidebar.props('unfoldable')).toBe(true)
    expect(coreuiSidebar.props('overlaid')).toBe(true)
  })

  it('emits "hidden" event when CoreUI Sidebar emits "hide" event', async () => {
    const component = await mountSuspended(SideBar, {
      props: { visible: true, largeScreen: true },
      global: { stubs },
    })
    await component.findComponent({ name: 'CSidebar' }).vm.$emit('hide')
    await component.vm.$nextTick()
    expect(component.emitted()).toHaveProperty('hidden')
  })

  it('renders the text and href for nav items', async () => {
    const component = await mountSuspended(SideBar, {
      props: { visible: true, largeScreen: true },
      global: {
        stubs: {
          ...stubs,
        },
      },
    })
    expect(component.text()).toContain('New scenario')
    const navLink = component.findComponent({ name: 'CNavLink' })
    expect(navLink.props('href')).toBe('/scenario/new')
  })
})
