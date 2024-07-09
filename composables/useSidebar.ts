// Whenever our SideBar component's "visible" prop is toggled to false, or initialized as false,
// the CoreUI Sidebar component will unavoidably emit a "hide" event (a callback fired after hiding).
// The CoreUI Sidebar component also emits a "hide" event when the user clicks outside the sidebar (mobile only).
// In the latter case, we want to obey this "hide" emit. But, if the "hide" emit is received as a result of
// the user directly requesting the sidebar to be hidden, we should NOT then try to toggle the
// sidebar a second time, which would undo the user's action.

// TODO: Consider cacheing the sidebar visibility preference client-side
export const useSidebar = () => {
  // NB: We cannot use the 'ref' function in a composable because it would result in Cross-Request State Pollution.
  // Instead, we must use 'useState', which ensures that the value is scoped to a specific client.
  const sidebarVisible = useState(() => false);
  let ignoreNextSidebarHide: boolean;

  const handleToggleSidebar = () => {
    if (sidebarVisible.value) {
      // We're now setting the sidebar to be hidden, so we should ignore the next "hide" event it emits.
      ignoreNextSidebarHide = true;
    } else {
      // We're now setting the sidebar to be visible, so we should NOT ignore the next "hide" event it emits.
      ignoreNextSidebarHide = false;
    }

    // We know that this event comes from the user pressing a button to toggle the sidebar,
    // as opposed to coming from the CoreUI Sidebar component's hide callback, so we should
    // always toggle the sidebar.
    sidebarVisible.value = !sidebarVisible.value;
  }

  const handleSidebarHidden = () => {
    if (ignoreNextSidebarHide) {
      // We're ignoring this superfluous "hide" event because the user has just directly requested the sidebar to be hidden.
      ignoreNextSidebarHide = false;
      return;
    }
    sidebarVisible.value = false;
  };

  return { sidebarVisible, handleToggleSidebar, handleSidebarHidden };
}
