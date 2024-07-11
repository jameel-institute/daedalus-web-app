// This file is for any shared mocks of any component.

import { defineComponent, h } from 'vue';

export const MockedCSidebar = defineComponent({
  name: 'CSidebar',
  render() {
    return h('div', this.$slots.default ? this.$slots.default() : []);
  },
});

export const MockedCSidebarHeader = defineComponent({
  name: 'CSidebarHeader',
  render() {
    return h('div', this.$slots.default ? this.$slots.default() : []);
  },
});

export const MockedCSidebarBrand = defineComponent({
  name: 'CSidebarBrand',
  render() {
    return h('div', this.$slots.default ? this.$slots.default() : []);
  },
});

export const MockedCSidebarNav = defineComponent({
  name: 'CSidebarNav',
  render() {
    return h('div', this.$slots.default ? this.$slots.default() : []);
  },
});

export const MockedCSidebarFooter = defineComponent({
  name: 'CSidebarFooter',
  render() {
    return h('div', this.$slots.default ? this.$slots.default() : []);
  },
});

export const MockedCSidebarToggler = defineComponent({
  name: 'CSidebarToggler',
  render() {
    return h('div', this.$slots.default ? this.$slots.default() : []);
  },
});

export const MockedCNavItem = defineComponent({
  name: 'CNavItem',
  render() {
    return h('div', this.$slots.default ? this.$slots.default() : []);
  },
});

export const MockedCNavLink = defineComponent({
  name: 'CNavLink',
  render() {
    return h('div', this.$slots.default ? this.$slots.default() : []);
  },
});

export const MockedCContainer = defineComponent({
  name: 'CContainer',
  render() {
    return h('div', this.$slots.default ? this.$slots.default() : []);
  },
});


export const MockedCHeader = defineComponent({
  name: 'CHeader',
  render() {
    return h('div', this.$slots.default ? this.$slots.default() : []);
  },
});

export const MockedCHeaderBrand = defineComponent({
  name: 'CHeaderBrand',
  render() {
    return h('div', this.$slots.default ? this.$slots.default() : []);
  },
});

export const MockedCHeaderToggler = defineComponent({
  name: 'CHeaderToggler',
  render() {
    return h('div', this.$slots.default ? this.$slots.default() : []);
  },
});

export const MockedCHeaderNav = defineComponent({
  name: 'CHeaderNav',
  render() {
    return h('div', this.$slots.default ? this.$slots.default() : []);
  },
});