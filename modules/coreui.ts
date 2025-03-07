import { addComponent, defineNuxtModule } from "@nuxt/kit";

// Auto-import components from @coreui/vue
// This makes the components available not only in the Nuxt app but
// also in the Nuxt context that @nuxt/test-utils uses for vitest (after restarting vitest).
// https://nuxt.com/docs/guide/directory-structure/components#npm-packages
export default defineNuxtModule({
  setup() {
    addComponent({
      name: "CAccordion",
      export: "CAccordion",
      filePath: "@coreui/vue/src/components/accordion/CAccordion",
    });
    addComponent({
      name: "CAccordionBody",
      export: "CAccordionBody",
      filePath: "@coreui/vue/src/components/accordion/CAccordionBody",
    });
    addComponent({
      name: "CAccordionHeader",
      export: "CAccordionHeader",
      filePath: "@coreui/vue/src/components/accordion/CAccordionHeader",
    });
    addComponent({
      name: "CAccordionItem",
      export: "CAccordionItem",
      filePath: "@coreui/vue/src/components/accordion/CAccordionItem",
    });
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
      name: "CContainer",
      export: "CContainer",
      filePath: "@coreui/vue/src/components/grid/CContainer",
    });
    addComponent({
      name: "CDropdown",
      export: "CDropdown",
      filePath: "@coreui/vue/src/components/dropdown/CDropdown",
    });
    addComponent({
      name: "CDropdownDivider",
      export: "CDropdownDivider",
      filePath: "@coreui/vue/src/components/dropdown/CDropdownDivider",
    });
    addComponent({
      name: "CDropdownHeader",
      export: "CDropdownHeader",
      filePath: "@coreui/vue/src/components/dropdown/CDropdownHeader",
    });
    addComponent({
      name: "CDropdownItem",
      export: "CDropdownItem",
      filePath: "@coreui/vue/src/components/dropdown/CDropdownItem",
    });
    addComponent({
      name: "CDropdownMenu",
      export: "CDropdownMenu",
      filePath: "@coreui/vue/src/components/dropdown/CDropdownMenu",
    });

    addComponent({
      name: "CDropdownToggle",
      export: "CDropdownToggle",
      filePath: "@coreui/vue/src/components/dropdown/CDropdownToggle",
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
      name: "CFormFeedback",
      export: "CFormFeedback",
      filePath: "@coreui/vue/src/components/form/CFormFeedback",
    });
    addComponent({
      name: "CFormInput",
      export: "CFormInput",
      filePath: "@coreui/vue/src/components/form/CFormInput",
    });
    addComponent({
      name: "CFormLabel",
      export: "CFormLabel",
      filePath: "@coreui/vue/src/components/form/CFormLabel",
    });
    addComponent({
      name: "CFormRange",
      export: "CFormRange",
      filePath: "@coreui/vue/src/components/form/CFormRange",
    });
    addComponent({
      name: "CFormSwitch",
      export: "CFormSwitch",
      filePath: "@coreui/vue/src/components/form/CFormSwitch",
    });
    addComponent({
      name: "CHeader",
      export: "CHeader",
      filePath: "@coreui/vue/src/components/header/CHeader",
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
      name: "CModal",
      export: "CModal",
      filePath: "@coreui/vue/src/components/modal/CModal",
    });
    addComponent({
      name: "CModalHeader",
      export: "CModalHeader",
      filePath: "@coreui/vue/src/components/modal/CModalHeader",
    });
    addComponent({
      name: "CModalTitle",
      export: "CModalTitle",
      filePath: "@coreui/vue/src/components/modal/CModalTitle",
    });
    addComponent({
      name: "CModalBody",
      export: "CModalBody",
      filePath: "@coreui/vue/src/components/modal/CModalBody",
    });
    addComponent({
      name: "CNavbar",
      export: "CNavbar",
      filePath: "@coreui/vue/src/components/navbar/CNavbar",
    });
    addComponent({
      name: "CNavbarBrand",
      export: "CNavbarBrand",
      filePath: "@coreui/vue/src/components/navbar/CNavbarBrand",
    });
    addComponent({
      name: "CNavbarToggler",
      export: "CNavbarToggler",
      filePath: "@coreui/vue/src/components/navbar/CNavbarToggler",
    });
    addComponent({
      name: "CNavbarNav",
      export: "CNavbarNav",
      filePath: "@coreui/vue/src/components/navbar/CNavbarNav",
    });
    addComponent({
      name: "CNavItem",
      export: "CNavItem",
      filePath: "@coreui/vue/src/components/nav/CNavItem",
    });
    addComponent({
      name: "CNavLink",
      export: "CNavLink",
      filePath: "@coreui/vue/src/components/nav/CNavLink",
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
      name: "CTooltip",
      export: "CTooltip",
      filePath: "@coreui/vue/src/components/tooltip/CTooltip",
    });
  },
});
