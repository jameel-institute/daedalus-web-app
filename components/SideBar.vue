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
        <CNavLink :href="localeRoute('scenarios-new').href">
          <CIcon class="nav-icon" icon="cilPlus" size="lg" /> {{ t('scenarios.new.heading') }}
        </CNavLink>
      </CNavItem>
      <CNavItem>
        <CNavLink href="/404.html">
          <CIcon class="nav-icon" icon="cilBookmark" size="lg" /> {{ t('bookmarks.index.heading') }}
        </CNavLink>
      </CNavItem>
      <CNavItem>
        <CNavLink href="/404.html">
          <CIcon class="nav-icon" icon="cilHistory" size="lg" /> {{ t('history.index.heading') }}
        </CNavLink>
      </CNavItem>
      <CNavItem>
        <CNavLink href="/404.html">
          <CIcon class="nav-icon" icon="cilShareAlt" size="lg" /> {{ t('buttons.share') }}
        </CNavLink>
      </CNavItem>
      <CNavItem>
        <CNavLink href="/404.html">
          <CIcon class="nav-icon" icon="cilCloudDownload" size="lg" /> {{ t('buttons.download') }}
        </CNavLink>
      </CNavItem>
      <CNavItem>
        <CNavLink href="/404.html">
          <CIcon class="nav-icon" icon="cilNoteAdd" size="lg" /> {{ t('buttons.notes.add') }}
        </CNavLink>
      </CNavItem>
    </CSidebarNav>
    <CSidebarHeader class="border-top d-flex">
      <!-- Use CoreUI Sidebar Header component instead of footer so that stylings for CoreUI Sidebar Brand component work -->
      <CSidebarBrand>
        <div class="sidebar-brand-full">
          <img class="img-fluid mb-1" src="~/assets/img/IMPERIAL_JAMEEL_INSTITUTE_LOCKUP-p-500.png" :alt="t('buttons.notes.add')">
        </div>
      </CSidebarBrand>
    </CSidebarHeader>
  </CSidebar>
</template>

<script lang="ts" setup>
import { CIcon } from "@coreui/icons-vue";

const { t } = useI18n();
const localeRoute = useLocaleRoute();

const visible = defineModel("visible", { type: Boolean, required: true });
const largeScreen = ref(true);

const hideHasNeverBeenEmitted = ref(true);
function handleHide() {
  if (hideHasNeverBeenEmitted.value) {
    // If this is the first 'hide', which is emitted on page load, we un-do it.
    // This is because the CoreUI Sidebar component emits a 'hide' event on page load, which we
    // don't want to obey for larger screen sizes.
    resetSidebarPerScreenSize();
    hideHasNeverBeenEmitted.value = false;
  }
  else {
    // If this is not the first 'hide', emitted on page load, we obey it and sync
    // the parent component's value.
    visible.value = false;
  }
}

const breakpoint = 992; // CoreUI's "lg" breakpoint
function resetSidebarPerScreenSize() {
  // Set the default values for the sidebar based on the screen size.
  if (window.innerWidth < breakpoint) {
    visible.value = false;
    largeScreen.value = false;
  }
  else {
    visible.value = true;
    largeScreen.value = true;
  }
}

onMounted(() => {
  window.addEventListener("resize", resetSidebarPerScreenSize);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", resetSidebarPerScreenSize);
});
</script>

<style lang="scss" scoped>
</style>
