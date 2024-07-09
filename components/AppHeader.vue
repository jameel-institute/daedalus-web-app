<template>
  <CHeader class="header-sticky p-0" :class="{'shadow-sm': isScrolled}">
    <CContainer fluid class="border-bottom px-4 mt-1 justify-content-start">
      <CHeaderToggler @click="sidebarStore.toggleSidebar()" type="button" style="margin-inline-start: -14px;">
        <CIcon icon="cilMenu" size="lg"/>
      </CHeaderToggler>
      <CHeaderBrand href="/">
        <CIcon icon="cilGlobeAlt" size="lg"/>
        <span class="ms-2 py">DAEDALUS Explore</span>
        <!-- <span style="color: red"> {{ sidebarStore.isVisible }} </span> -->
      </CHeaderBrand>
      <div class="ms-5 d-none d-xxl-block" v-show="showBreadcrumbs">
        <Breadcrumb/>
      </div>
      <!-- <div class="d-none d-xxl-block ms-auto mt-2">
        <AnalysesProgress/>
      </div>
      <div class="d-xxl-none ms-auto fixed-bottom bg-body p-3 pb-2 border-start border-top rounded-start-3 shadow-lg" style="max-width: 728px">
        <AnalysesProgress/>
      </div> -->
      <CHeaderNav class="ms-auto d-xxl-none">
        <CNavItem class="py-1">
          <VerticalRule/>
        </CNavItem>
        <CNavItem href="#">
          <CIcon icon="cilCloudDownload" size="lg"/>
        </CNavItem>
        <CNavItem class="py-1">
          <VerticalRule/>
        </CNavItem>
        <CNavItem href="#"> ?</CNavItem>
      </CHeaderNav>
    </CContainer>
    <CContainer fluid class="d-xxl-none" style="font-size: 0.74rem; margin-left: 63px" v-show="showBreadcrumbs">
      <Breadcrumb/>
    </CContainer>
  </CHeader>
</template>

<script setup lang="ts">
import { CIcon } from '@coreui/icons-vue';
import throttle from 'lodash.throttle';
import { useRoute } from 'vue-router';
import { useSidebarStore } from '@/stores/sidebar';

const route = useRoute();
const sidebarStore = useSidebarStore();

const showBreadcrumbs = computed(() => route.meta.hideBreadcrumbs !== true);

// We apply a shadow to the header when the position is scrolled down
const isScrolled = ref(false);
const handleScroll = throttle(() => {
  isScrolled.value = document.documentElement.scrollTop > 0;
}, 100);

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});

const VerticalRule = h('div', { class: "vr h-100 mx-2 text-body text-opacity-75" })
</script>

<style lang="scss">
.header-brand {
  color: $primary;
}
.header {
  margin-bottom: $app-header-margin-bottom;
}
</style>