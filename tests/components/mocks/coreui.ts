import { vi } from 'vitest';

import {
  MockedCContainer,
  MockedCSidebar,
  MockedCSidebarHeader,
  MockedCSidebarBrand,
  MockedCSidebarNav,
  MockedCSidebarFooter,
  MockedCSidebarToggler,
  MockedCNavItem,
  MockedCNavLink,
  MockedCHeader,
  MockedCHeaderBrand,
  MockedCHeaderNav,
  MockedCHeaderToggler,
  // Add additional mocked components here
  // MockedCBreadcrumb,
  // MockedCBreadcrumbItem,
  // MockedCProgress
} from './components';

export const mockCoreuiStubs = {
  CContainer: true,
  CSidebar: true,
  CSidebarHeader: true,
  CSidebarBrand: true,
  CSidebarNav: true,
  CSidebarFooter: true,
  CSidebarToggler: true,
  CNavItem: true,
  CNavLink: true,
  CHeader: true,
  CHeaderBrand: true,
  CHeaderNav: true,
  CHeaderToggler: true,
  // Add additional mocked components here
  // CBreadcrumb: MockedCBreadcrumb,
  // CBreadcrumbItem: MockedCBreadcrumbItem,
  // CProgress: MockedCProgress
};

// export const mockCoreuiComponents = () => {
//   vi.mock('@coreui/vue/src/components/grid/CContainer', () => MockedCContainer);
//   vi.mock('@coreui/vue/src/components/sidebar/CSidebar', () => MockedCSidebar);
//   vi.mock('@coreui/vue/src/components/sidebar/CSidebarHeader', () => MockedCSidebarHeader);
//   vi.mock('@coreui/vue/src/components/sidebar/CSidebarBrand', () => MockedCSidebarBrand);
//   vi.mock('@coreui/vue/src/components/sidebar/CSidebarNav', () => MockedCSidebarNav);
//   vi.mock('@coreui/vue/src/components/sidebar/CSidebarFooter', () => MockedCSidebarFooter);
//   vi.mock('@coreui/vue/src/components/sidebar/CSidebarToggler', () => MockedCSidebarToggler);
//   vi.mock('@coreui/vue/src/components/nav/CNavItem', () => MockedCNavItem);
//   vi.mock('@coreui/vue/src/components/nav/CNavLink', () => MockedCNavLink);
//   vi.mock('@coreui/vue/src/components/header/CHeader', () => MockedCHeader);
//   vi.mock('@coreui/vue/src/components/header/CHeaderBrand', () => MockedCHeaderBrand);
//   vi.mock('@coreui/vue/src/components/header/CHeaderToggler', () => MockedCHeaderToggler);
//   vi.mock('@coreui/vue/src/components/header/CHeaderNav', () => MockedCHeaderNav);
//   // Mock additional components as needed
//   // vi.mock('@coreui/vue/src/components/breadcrumb/CBreadcrumb', () => MockedCBreadcrumb);
//   // vi.mock('@coreui/vue/src/components/breadcrumb/CBreadcrumbItem', () => MockedCBreadcrumbItem);
//   // vi.mock('@coreui/vue/src/components/progress/CProgress', () => MockedCProgress);
// };