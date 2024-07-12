// @vitest-environment nuxt

import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime'

import DefaultLayout from '../../layouts/default.vue';

const stubs = {
  SideBar: {
    name: 'SideBar',
    template: '<div class="sidebar-stub"/>',
    props: [ 'visible' ],
  },
  AppHeader: {
    name: 'AppHeader',
    template: '<div class="app-header-stub"/>',
  },
  CContainer: true,
}

describe('DefaultLayout', () => {
  it('initially hides the sidebar, and can open and close it from the app header', async () => {
    const component = await mountSuspended(DefaultLayout, { global: { stubs } });

    const sidebar = component.findComponent({ name: 'SideBar' });
    expect(sidebar.props('visible')).toBe(false);

    const header = component.findComponent({ name: 'AppHeader' });
    await header.vm.$emit('toggle-sidebar');
    expect(sidebar.props('visible')).toBe(true);

    await header.vm.$emit('toggle-sidebar');
    expect(sidebar.props('visible')).toBe(false);
  });

  it('can close the sidebar from the sidebar itself, using "toggle" emit', async () => {
    const component = await mountSuspended(DefaultLayout, { global: { stubs } });

    const sidebar = component.findComponent({ name: 'SideBar' });
    expect(sidebar.props('visible')).toBe(false);

    const header = component.findComponent({ name: 'AppHeader' });
    await header.vm.$emit('toggle-sidebar');
    expect(sidebar.props('visible')).toBe(true);

    await sidebar.vm.$emit('toggle');
    expect(sidebar.props('visible')).toBe(false);
  });

  it('keeps the "visible" prop in sync with the state of the CSidebar component when "hidden" is emitted', async () => {
    const component = await mountSuspended(DefaultLayout, { global: { stubs } });

    const sidebar = component.findComponent({ name: 'SideBar' });
    expect(sidebar.props('visible')).toBe(false);

    const header = component.findComponent({ name: 'AppHeader' });
    await header.vm.$emit('toggle-sidebar');
    expect(sidebar.props('visible')).toBe(true);

    await sidebar.vm.$emit('hidden');
    expect(sidebar.props('visible')).toBe(false);
  });
});
