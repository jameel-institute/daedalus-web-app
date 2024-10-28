<template>
  <CHeader class="header-sticky p-0" :class="{ 'shadow-sm': isScrolled }">
    <CContainer id="headerNavContainer" fluid class="border-bottom mt-1 justify-content-between">
      <div class="d-flex">
        <CHeaderToggler class="d-lg-none" @click="$emit('toggleSidebarVisibility')">
          <span data-testid="toggle-sidebar-button">
            <CIcon icon="cilMenu" size="lg" />
          </span>
        </CHeaderToggler>
        <div class="header-brand px-2">
          <NuxtLink prefetch-on="interaction" to="/" class="nav-link">
            <CIcon icon="cilGlobeAlt" size="lg" />
            <span id="appTitle">DAEDALUS Explore</span>
          </NuxtLink>
        </div>
      </div>
      <div class="d-none d-sm-block">
        <img
          data-testid="ji-logo-header"
          style="width: 150px;"
          class="img-fluid"
          src="~/assets/img/IMPERIAL_JAMEEL_INSTITUTE_LOCKUP-p-500.png"
          alt="Imperial College and Community Jameel logo"
        >
      </div>
    </CContainer>
  </CHeader>
</template>

<script setup lang="ts">
import { CIcon } from "@coreui/icons-vue";
import throttle from "lodash.throttle";

defineEmits<{
  toggleSidebarVisibility: []
}>();

// We apply a shadow to the header when the position is scrolled down
const isScrolled = ref(false);
const handleScroll = throttle(() => {
  isScrolled.value = document.documentElement.scrollTop > 0;
}, 100);

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style lang="scss" scoped>
@use "sass:map";

.header-brand {
  color: $primary;

  .icon {
    position: relative;
    top: 0.1rem;
  }
}
.header {
  margin-bottom: $app-header-margin-bottom;
}
.header-toggler {
  margin-inline-start: -14px;
}

// Align sidebar toggler with sidebar icons
#headerNavContainer {
  padding-left: 1.5rem;
  @media (min-width: map.get($grid-breakpoints, 'lg')) {
    padding-left: 0.9rem;
  }
  @media (max-width: map.get($grid-breakpoints, 'lg')) {
    border-bottom-color: rgb(235, 238, 245) !important;
  }
}
#help {
  width: 1.4rem;
}
#helpNavLink {
  &:not(:hover) {
    filter: opacity(0.5);
  }
}
#appTitle {
  margin-left: 0.75rem;
}
</style>
