<script setup lang="ts">
import { CIcon } from '@coreui/icons-vue'
import throttle from 'lodash.throttle'
import { useRoute } from 'vue-router'

const emit = defineEmits(['toggleSidebarVisibility'])

const route = useRoute()

const showBreadcrumbs = computed(() => route.meta.hideBreadcrumbs !== true)

function toggleSidebarVisibility() {
  emit('toggleSidebarVisibility')
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
</script>

<template>
  <CHeader class="header-sticky p-0" :class="{ 'shadow-sm': isScrolled }">
    <CContainer id="headerContainer" fluid class="border-bottom mt-1 justify-content-start">
      <CHeaderToggler class="d-lg-none" @click="toggleSidebarVisibility">
        <span data-testid="toggle-sidebar-visibility-button">
          <CIcon icon="cilMenu" size="lg" />
        </span>
      </CHeaderToggler>
      <CHeaderBrand href="/" class="px-2">
        <CIcon icon="cilGlobeAlt" size="lg" />
        <span class="ms-2 py">DAEDALUS Explore</span>
      </CHeaderBrand>
      <div v-show="showBreadcrumbs" class="ms-5 d-none d-xxl-block">
        <BreadCrumb />
      </div>
      <CHeaderNav class="ms-auto">
        <CNavItem class="py-1">
          <div class="vr h-100 mx-2 text-body text-opacity-75" />
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

// Align sidebar toggler with sidebar icons
#headerContainer {
  @media (max-width: map.get($grid-breakpoints, 'lg')) {
    padding-left: 1.5rem;
  }

  padding-left: 0.9rem;
}
</style>
