<template>
  <CSidebar
    unfoldable
    :visible="visible"
    @hide="handleHide"
    class="sidebar-fixed border-end"
  >
    <CSidebarNav role="navigation">
      <CNavItem>
        <CNavLink href="/scenario/new">
          <CIcon class="nav-icon" icon="cilPlus" size="lg"/> New scenario
        </CNavLink>
      </CNavItem>
      <CNavItem>
        <CNavLink href="/bookmarks">
          <CIcon class="nav-icon" icon="cilBookmark" size="lg"/> Bookmarks
        </CNavLink>
      </CNavItem>
      <CNavItem>
        <CNavLink href="404.html">
          <CIcon class="nav-icon" icon="cilHistory" size="lg"/> My history
        </CNavLink>
      </CNavItem>
      <CNavItem>
        <CNavLink href="404.html">
          <CIcon class="nav-icon" icon="cilShareAlt" size="lg"/> Share
        </CNavLink>
      </CNavItem>
      <CNavItem>
        <CNavLink href="404.html">
          <CIcon class="nav-icon" icon="cilCloudDownload" size="lg"/> Download
        </CNavLink>
      </CNavItem>
      <CNavItem>
        <CNavLink href="404.html">
          <CIcon class="nav-icon" icon="cilNoteAdd" size="lg"/> Add notes
        </CNavLink>
      </CNavItem>

      <CNavItem class="mt-auto">
        <CNavLink
          href="#"
          @click="handleToggle"
          aria-label="Close sidebar"
          data-testid="close-sidebar-button"
        >
          <CIcon class="nav-icon" icon="cilArrowThickToLeft" size="lg"/> Hide sidebar
        </CNavLink>
      </CNavItem>
    </CSidebarNav>
    <CSidebarHeader class="border-top d-flex">
      <!-- Use CoreUI Sidebar Header component instead of footer so that stylings for CoreUI Sidebar Brand component work -->
      <CSidebarBrand>
        <div class="sidebar-brand-full"><img class="img-fluid mb-1" src="~/assets/img/IMPERIAL_JAMEEL_INSTITUTE_LOCKUP-p-500.png" alt="Imperial College and Community Jameel logo"></div>
        <div class="sidebar-brand-narrow"><img class="img-fluid ms-2" src="~/assets/img/Imperial_avatar_500x500px_blue_I.png" alt="Imperial College avatar"></div>
      </CSidebarBrand>
    </CSidebarHeader>
  </CSidebar>
</template>

<script lang="ts" setup>
import { CIcon } from '@coreui/icons-vue';

const props = defineProps({
  visible: Boolean
});
const emit = defineEmits(['toggle', 'hidden']);
const handleToggle = () => {
  emit('toggle');
};

const handleHide = () => {
  emit('hidden');
};
</script>

<style lang="scss" scoped>
.sidebar-brand-narrow {
  filter: opacity(50%) // Probably not allowed - placeholder style for Imperial 'I' logo to try and make the colour stand out less.
}
</style>