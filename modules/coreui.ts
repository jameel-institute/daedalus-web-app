import { addComponent, defineNuxtModule } from "@nuxt/kit";

// Auto-import components from @coreui/vue
// This makes the components available not only in the Nuxt app but
// also in the Nuxt context that @nuxt/test-utils uses for vitest (after restarting vitest).
// https://nuxt.com/docs/guide/directory-structure/components#npm-packages
export default defineNuxtModule({
  setup() {
    addComponent({
      name: "CAlert",
      export: "CAlert",
      filePath: "@coreui/vue/src/components/alert/CAlert",
    });
    addComponent({
      name: "CButtonGroup",
      export: "CButtonGroup",
      filePath: "@coreui/vue/src/components/button-group/CButtonGroup",
    });
    addComponent({
      name: "CButton",
      export: "CButton",
      filePath: "@coreui/vue/src/components/button/CButton",
    });
    addComponent({
      name: "CCol",
      export: "CCol",
      filePath: "@coreui/vue/src/components/grid/CCol",
    });
    addComponent({
      name: "CForm",
      export: "CForm",
      filePath: "@coreui/vue/src/components/form/CForm",
    });
    addComponent({
      name: "CFormCheck",
      export: "CFormCheck",
      filePath: "@coreui/vue/src/components/form/CFormCheck",
    });
    addComponent({
      name: "CFormLabel",
      export: "CFormLabel",
      filePath: "@coreui/vue/src/components/form/CFormLabel",
    });
    addComponent({
      name: "CHeader",
      export: "CHeader",
      filePath: "@coreui/vue/src/components/header/CHeader",
    });
    addComponent({
      name: "CHeaderBrand",
      export: "CHeaderBrand",
      filePath: "@coreui/vue/src/components/header/CHeaderBrand",
    });
    addComponent({
      name: "CHeaderToggler",
      export: "CHeaderToggler",
      filePath: "@coreui/vue/src/components/header/CHeaderToggler",
    });
    addComponent({
      name: "CHeaderNav",
      export: "CHeaderNav",
      filePath: "@coreui/vue/src/components/header/CHeaderNav",
    });
    addComponent({
      name: "CRow",
      export: "CRow",
      filePath: "@coreui/vue/src/components/grid/CRow",
    });
    addComponent({
      name: "CSidebar",
      export: "CSidebar",
      filePath: "@coreui/vue/src/components/sidebar/CSidebar",
    });
    addComponent({
      name: "CSidebarHeader",
      export: "CSidebarHeader",
      filePath: "@coreui/vue/src/components/sidebar/CSidebarHeader",
    });
    addComponent({
      name: "CSidebarBrand",
      export: "CSidebarBrand",
      filePath: "@coreui/vue/src/components/sidebar/CSidebarBrand",
    });
    addComponent({
      name: "CSidebarNav",
      export: "CSidebarNav",
      filePath: "@coreui/vue/src/components/sidebar/CSidebarNav",
    });
    addComponent({
      name: "CSidebarFooter",
      export: "CSidebarFooter",
      filePath: "@coreui/vue/src/components/sidebar/CSidebarFooter",
    });
    addComponent({
      name: "CSpinner",
      export: "CSpinner",
      filePath: "@coreui/vue/src/components/spinner/CSpinner",
    });
    addComponent({
      name: "CNavItem",
      export: "CNavItem",
      filePath: "@coreui/vue/src/components/nav/CNavItem",
    });
    addComponent({
      name: "CContainer",
      export: "CContainer",
      filePath: "@coreui/vue/src/components/grid/CContainer",
    });
    addComponent({
      name: "CBreadcrumb",
      export: "CBreadcrumb",
      filePath: "@coreui/vue/src/components/breadcrumb/CBreadcrumb",
    });
    addComponent({
      name: "CBreadcrumbItem",
      export: "CBreadcrumbItem",
      filePath: "@coreui/vue/src/components/breadcrumb/CBreadcrumbItem",
    });
    addComponent({
      name: "CProgress",
      export: "CProgress",
      filePath: "@coreui/vue/src/components/progress/CProgress",
    });
  },
});
