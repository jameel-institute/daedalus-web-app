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
        <CNavLink href="/scenario/new">
          <CIcon class="nav-icon" icon="cilPlus" size="lg" /> New scenario
        </CNavLink>
      </CNavItem>
      <CNavItem>
        <CNavLink href="/bookmarks">
          <CIcon class="nav-icon" icon="cilBookmark" size="lg" /> Bookmarks
        </CNavLink>
      </CNavItem>
      <CNavItem>
        <CNavLink href="404.html">
          <CIcon class="nav-icon" icon="cilHistory" size="lg" /> My history
        </CNavLink>
      </CNavItem>
      <CNavItem>
        <CNavLink href="404.html">
          <CIcon class="nav-icon" icon="cilShareAlt" size="lg" /> Share
        </CNavLink>
      </CNavItem>
      <CNavItem>
        <CNavLink href="404.html">
          <CIcon class="nav-icon" icon="cilCloudDownload" size="lg" /> Download
        </CNavLink>
      </CNavItem>
      <CNavItem>
        <CNavLink href="404.html">
          <CIcon class="nav-icon" icon="cilNoteAdd" size="lg" /> Add notes
        </CNavLink>
      </CNavItem>
    </CSidebarNav>
    <CSidebarHeader class="border-top d-flex">
      <!-- Use CoreUI Sidebar Header component instead of footer so that stylings for CoreUI Sidebar Brand component work -->
      <CSidebarBrand>
        <div class="sidebar-brand-full">
          <img class="img-fluid mb-1" src="~/assets/img/IMPERIAL_JAMEEL_INSTITUTE_LOCKUP-p-500.png" alt="Imperial College and Community Jameel logo">
        </div>
      </CSidebarBrand>
    </CSidebarHeader>
  </CSidebar>
</template>

<script lang="ts" setup>
import { CIcon } from '@coreui/icons-vue'

defineProps({
  visible: Boolean,
  largeScreen: Boolean,
})
const emit = defineEmits(['hidden'])

function handleHide() {
  emit('hidden')
}
</script>

<style lang="scss" scoped>
</style>
