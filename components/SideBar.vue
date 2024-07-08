<template>
  <CSidebar unfoldable class="sidebar-fixed border-end" id="sidebar">
    <CSidebarHeader class="border-bottom">
      <CSidebarBrand>
        <div class="sidebar-brand-full"><img class="img-fluid mb-1" src="~/assets/img/IMPERIAL_JAMEEL_INSTITUTE_LOCKUP-p-500.png" alt="Imperial College and Community Jameel logo"></div>
        <div class="sidebar-brand-narrow"><img class="img-fluid ms-2" src="~/assets/img/Imperial_avatar_500x500px_blue_I.png" alt="Imperial College avatar"></div>
      </CSidebarBrand>
      <button class="btn-close d-lg-none" type="button" data-coreui-dismiss="offcanvas" data-coreui-theme="dark" aria-label="Close" onclick="coreui.Sidebar.getInstance(document.querySelector(&quot;#sidebar&quot;)).toggle()"></button>
    </CSidebarHeader>
    <CSidebarNav data-coreui="navigation">
      <CNavItem>
        <CNavLink href="404.html">
          <CIcon class="nav-icon" icon="cilPlus" size="lg"/> New scenario
        </CNavLink>
      </CNavItem>
      <CNavItem>
        <CNavLink href="404.html">
          <CIcon class="nav-icon" icon="cilBookmark" size="lg"/> Bookmarks
        </CNavLink>
      </CNavItem>
      <CNavItem><CNavLink href="404.html">
        <CIcon class="nav-icon" icon="cilHistory" size="lg"/> My history
      </CNavLink></CNavItem>
      <CNavItem>
        <CNavLink href="404.html">
          <CIcon class="nav-icon" icon="cilShareAlt" size="lg"/> Share
        </CNavLink>
        <CNavLink href="404.html">
          <CIcon class="nav-icon" icon="cilCloudDownload" size="lg"/> Download
        </CNavLink>
        <CNavLink href="404.html">
          <CIcon class="nav-icon" icon="cilNoteAdd" size="lg"/> Add notes
        </CNavLink>
      </CNavItem>
    </CSidebarNav>
    <CSidebarFooter class="border-top d-none d-md-flex">
      <CSidebarToggler data-coreui="unfoldable" type="button"/>
    </CSidebarFooter>
  </CSidebar>
</template>

<script lang="ts" setup>
  import { CIcon } from '@coreui/icons-vue';
</script>

<style>

</style>