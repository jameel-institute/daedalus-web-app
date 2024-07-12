<script setup lang="ts">
import { CIcon } from '@coreui/icons-vue'
import throttle from 'lodash.throttle'
import { useRoute } from 'vue-router'

const emit = defineEmits(['toggleSidebar'])

const route = useRoute()

const showBreadcrumbs = computed(() => route.meta.hideBreadcrumbs !== true)

function toggleSidebar() {
  emit('toggleSidebar')
}

// We apply a shadow to the header when the position is scrolled down
const isScrolled = ref(false)
const handleScroll = throttle(() => {
  isScrolled.value = document.documentElement.scrollTop > 0
}, 100)

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})

const VerticalRule = h('div', { class: 'vr h-100 mx-2 text-body text-opacity-75' })
</script>

<template>
  <CHeader class="header-sticky p-0" :class="{ 'shadow-sm': isScrolled }">
    <CContainer fluid class="border-bottom px-3 mt-1 justify-content-start">
      <CHeaderToggler @click="toggleSidebar">
        <span data-testid="toggle-sidebar-button">
          <CIcon icon="cilMenu" size="lg" />
        </span>
      </CHeaderToggler>
      <CHeaderBrand href="/">
        <CIcon icon="cilGlobeAlt" size="lg" />
        <span class="ms-2 py">DAEDALUS Explore</span>
      </CHeaderBrand>
      <div v-show="showBreadcrumbs" class="ms-5 d-none d-xxl-block">
        <BreadCrumb />
      </div>
      <CHeaderNav class="ms-auto d-xxl-none">
        <CNavItem class="py-1">
          <VerticalRule />
        </CNavItem>
        <CNavItem href="#">
          <CIcon icon="cilCloudDownload" size="lg" />
        </CNavItem>
        <CNavItem class="py-1">
          <VerticalRule />
        </CNavItem>
        <CNavItem href="#">
          ?
        </CNavItem>
      </CHeaderNav>
    </CContainer>
    <CContainer v-show="showBreadcrumbs" fluid class="d-xxl-none full-breadcrumb-container">
      <BreadCrumb />
    </CContainer>
  </CHeader>
</template>

<style lang="scss" scoped>
@use "sass:map";

.header-brand {
  color: $primary;
}
.header {
  margin-bottom: $app-header-margin-bottom;
}
.header-toggler {
  margin-inline-start: -14px;
}
$sidebar-narrow-width: 4rem;
.full-breadcrumb-container {
  font-size: 0.74rem;

  @media (min-width: map.get($grid-breakpoints, 'lg')) {
    // For some reason, without !important, margin-left jumps on refresh.
    margin-left: calc($sidebar-narrow-width + 0.5rem) !important;
  }
}
</style>
