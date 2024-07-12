// Tree-shaking for CoreUI Vue, by using verbose imports with explicit component file paths,
// is necessary because:
// 1. Tree-shaking doesn't seem to take effect by default for CoreUI Vue, probably because it's
// not configured to do so (with 'sideEffects' in its package.json)
// 2. Therefore, in a production-like environment (that is, after building), when you try to import
// any component from CoreUI Vue, it tries to load components that we don't need and which don't work, such as
// CWidgetStatsB (which fails because it can't find the module 'vue-types'?).

// NB Dynamic imports mysteriously stopped working after a few hours so I changed them to static
// imports.

// It's OK (performance-wise) to load all these components here because we expect them to be used
// on every page, but if you have components that are only used on certain pages, you should
// import them in the page components themselves.

import { CSidebar } from '@coreui/vue/src/components/sidebar/CSidebar'
import { CSidebarHeader } from '@coreui/vue/src/components/sidebar/CSidebarHeader'
import { CSidebarBrand } from '@coreui/vue/src/components/sidebar/CSidebarBrand'
import { CSidebarNav } from '@coreui/vue/src/components/sidebar/CSidebarNav'
import { CSidebarFooter } from '@coreui/vue/src/components/sidebar/CSidebarFooter'
import { CSidebarToggler } from '@coreui/vue/src/components/sidebar/CSidebarToggler'
import { CNavItem } from '@coreui/vue/src/components/nav/CNavItem'
import { CNavLink } from '@coreui/vue/src/components/nav/CNavLink'
import { CContainer } from '@coreui/vue/src/components/grid/CContainer'
import { CHeader } from '@coreui/vue/src/components/header/CHeader'
import { CHeaderBrand } from '@coreui/vue/src/components/header/CHeaderBrand'
import { CHeaderToggler } from '@coreui/vue/src/components/header/CHeaderToggler'
import { CHeaderNav } from '@coreui/vue/src/components/header/CHeaderNav'
import { CBreadcrumb } from '@coreui/vue/src/components/breadcrumb/CBreadcrumb'
import { CBreadcrumbItem } from '@coreui/vue/src/components/breadcrumb/CBreadcrumbItem'
import { CProgress } from '@coreui/vue/src/components/progress/CProgress'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('CSidebar', CSidebar)
  nuxtApp.vueApp.component('CSidebarHeader', CSidebarHeader)
  nuxtApp.vueApp.component('CSidebarBrand', CSidebarBrand)
  nuxtApp.vueApp.component('CSidebarNav', CSidebarNav)
  nuxtApp.vueApp.component('CSidebarFooter', CSidebarFooter)
  nuxtApp.vueApp.component('CSidebarToggler', CSidebarToggler)
  nuxtApp.vueApp.component('CNavItem', CNavItem)
  nuxtApp.vueApp.component('CNavLink', CNavLink)
  nuxtApp.vueApp.component('CContainer', CContainer)
  nuxtApp.vueApp.component('CHeader', CHeader)
  nuxtApp.vueApp.component('CHeaderBrand', CHeaderBrand)
  nuxtApp.vueApp.component('CHeaderToggler', CHeaderToggler)
  nuxtApp.vueApp.component('CHeaderNav', CHeaderNav)
  nuxtApp.vueApp.component('CBreadcrumb', CBreadcrumb)
  nuxtApp.vueApp.component('CBreadcrumbItem', CBreadcrumbItem)
  nuxtApp.vueApp.component('CProgress', CProgress)
})
