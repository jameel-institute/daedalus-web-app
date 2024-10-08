<template>
  <CSidebar
    :visible="visible"
    :unfoldable="appStore.largeScreen"
    :overlaid="appStore.largeScreen"
    class="sidebar-fixed border-end"
    @hide="handleHide"
  >
    <CSidebarNav role="navigation">
      <CNavItem>
        <NuxtLink prefetch-on="interaction" to="/scenarios/new" class="nav-link">
          <CIcon icon="cilPlus" size="lg" class="nav-icon" /> New scenario
        </NuxtLink>
      </CNavItem>
    </CSidebarNav>
    <CSidebarHeader class="border-top d-flex">
      <!-- Use CoreUI Sidebar Header component instead of footer so that stylings for CoreUI Sidebar Brand component work -->
      <CSidebarBrand>
        <div class="sidebar-brand-full">
          <img
            data-testid="logo"
            class="img-fluid mb-1"
            :title="versionTooltipContent"
            src="~/assets/img/IMPERIAL_JAMEEL_INSTITUTE_LOCKUP-p-500.png"
            alt="Imperial College and Community Jameel logo"
          >
        </div>
      </CSidebarBrand>
    </CSidebarHeader>
  </CSidebar>
</template>

<script lang="ts" setup>
import { CIcon } from "@coreui/icons-vue";

const appStore = useAppStore();

const versionTooltipContent = computed(() => {
  const vers = appStore.versions;
  if (vers) {
    return `Model version: ${vers.daedalusModel} \nR API version: ${vers.daedalusApi} \nWeb app version: ${vers.daedalusWebApp}`;
  } else {
    return undefined;
  }
});

const visible = defineModel("visible", { type: Boolean, required: true });

const resetSidebarPerScreenSize = () => {
  visible.value = appStore.largeScreen;
};

const hideHasNeverBeenEmitted = ref(true);
const handleHide = () => {
  if (hideHasNeverBeenEmitted.value) {
    // If this is the first 'hide', which is emitted on page load, we un-do it.
    // This is because the CoreUI Sidebar component emits a 'hide' event on page load, which we
    // don't want to obey for larger screen sizes.
    resetSidebarPerScreenSize();
    hideHasNeverBeenEmitted.value = false;
  } else {
    // If this is not the first 'hide', emitted on page load, we obey it and sync
    // the parent component's value.
    visible.value = false;
  }
};

onMounted(() => {
  window.addEventListener("resize", resetSidebarPerScreenSize);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", resetSidebarPerScreenSize);
});
</script>

<style lang="scss" scoped>
</style>
