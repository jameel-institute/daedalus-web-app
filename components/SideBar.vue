<template>
  <CSidebar
    :visible="visible"
    :unfoldable="largeScreen"
    :overlaid="largeScreen"
    class="sidebar-fixed border-end"
    @hide="handleHide"
  >
    <CSidebarNav role="navigation">
      <CNavItem>
        <NuxtLink prefetch-on="interaction" to="/scenarios/new" class="nav-link">
          <CIcon icon="cilPlus" size="lg" class="nav-icon" /> New scenario
        </NuxtLink>
      </CNavItem>
      <CNavItem>
        <NuxtLink prefetch-on="interaction" to="/" class="nav-link">
          <CIcon icon="cilBookmark" size="lg" class="nav-icon" /> Bookmarks
        </NuxtLink>
      </CNavItem>
      <CNavItem>
        <NuxtLink prefetch-on="interaction" to="/" class="nav-link">
          <CIcon icon="cilHistory" size="lg" class="nav-icon" /> My history
        </NuxtLink>
      </CNavItem>
      <CNavItem>
        <NuxtLink prefetch-on="interaction" to="/" class="nav-link">
          <CIcon icon="cilShareAlt" size="lg" class="nav-icon" /> Share
        </NuxtLink>
      </CNavItem>
      <CNavItem>
        <NuxtLink prefetch-on="interaction" to="/" class="nav-link">
          <CIcon icon="cilCloudDownload" size="lg" class="nav-icon" /> Download
        </NuxtLink>
      </CNavItem>
      <CNavItem>
        <NuxtLink prefetch-on="interaction" to="/" class="nav-link">
          <CIcon icon="cilNoteAdd" size="lg" class="nav-icon" /> Add notes
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
import type { VersionData } from "@/types/daedalusApiResponseTypes";

const { data: versionData } = useFetch("/api/versions") as { data: Ref<VersionData> };

const versionTooltipContent = computed(() => {
  if (versionData.value) {
    return `Model version: ${versionData.value.daedalusModel} \nR API version: ${versionData.value.daedalusApi} \nWeb app version: ${versionData.value.daedalusWebApp}`;
  } else {
    return undefined;
  }
});

const visible = defineModel("visible", { type: Boolean, required: true });
const largeScreen = ref(true);

const breakpoint = 992; // CoreUI's "lg" breakpoint
const resetSidebarPerScreenSize = () => {
  // Set the default values for the sidebar based on the screen size.
  if (window.innerWidth < breakpoint) {
    visible.value = false;
    largeScreen.value = false;
  } else {
    visible.value = true;
    largeScreen.value = true;
  }
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
