<template>
  <CHeader class="header-sticky p-0" :class="{ 'shadow-sm': isScrolled }">
    <CContainer id="headerNavContainer" fluid class="border-bottom mt-1 justify-content-start">
      <CHeaderToggler class="d-lg-none" @click="toggleSidebarVisibility">
        <span data-testid="toggle-sidebar-button">
          <CIcon icon="cilMenu" size="lg" />
        </span>
      </CHeaderToggler>
      <!-- TOdo - use NuxtLink instead of href below -->
      <CHeaderBrand href="/" class="px-2">
        <CIcon icon="cilGlobeAlt" size="lg" />
        <span id="appTitle">DAEDALUS Explore</span>
      </CHeaderBrand>
      <CHeaderNav class="ms-auto">
        <CNavItem class="py-1">
          <div class="vr h-100 mx-1 text-body text-opacity-75" />
        </CNavItem>
        <CNavItem id="helpNavLink" href="#">
          <img id="help" src="~/assets/icons/circleQuestion.svg">
        </CNavItem>
      </CHeaderNav>
    </CContainer>
  </CHeader>
</template>

<script setup lang="ts">
import { CIcon } from "@coreui/icons-vue";
import throttle from "lodash.throttle";

const emit = defineEmits(["toggleSidebarVisibility"]);

function toggleSidebarVisibility() {
  emit("toggleSidebarVisibility");
}

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
