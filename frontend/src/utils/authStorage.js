const AUTH_USER_KEY = "user";
const SESSION_ID_KEY = "sessionId";
const TAB_INSTANCE_ID_KEY = "tabInstanceId";
const PAGE_LOAD_MARKER_KEY = "_page_load_marker_";

// Get or create the page load marker (stored in sessionStorage to persist across refreshes)
function getOrCreatePageLoadMarker() {
  let marker = sessionStorage.getItem(PAGE_LOAD_MARKER_KEY);
  if (!marker) {
    marker = `load_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
    sessionStorage.setItem(PAGE_LOAD_MARKER_KEY, marker);
  }
  return marker;
}

// Generate a unique ID for this browser tab instance (in memory)
let TAB_INSTANCE_ID = null;

function generateTabInstanceId() {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
}

// Get or create the tab instance ID (in memory, restored from sessionStorage on refresh)
function getTabInstanceId() {
  if (!TAB_INSTANCE_ID) {
    // Try to restore from sessionStorage first (survives page refresh)
    const stored = sessionStorage.getItem(TAB_INSTANCE_ID_KEY);
    if (stored) {
      TAB_INSTANCE_ID = stored;
    } else {
      // First time this tab loads - generate new ID
      TAB_INSTANCE_ID = generateTabInstanceId();
    }
  }
  return TAB_INSTANCE_ID;
}

// Generate a unique session ID for this tab
function generateSessionId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Initialize or get the session ID for this tab
// Returns { sessionId, isDuplicatedTab: boolean }
export function getOrCreateSessionId() {
  const tabId = getTabInstanceId();
  const pageMarker = getOrCreatePageLoadMarker();
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  let isDuplicatedTab = false;

  // First time this tab is running - initialize session IDs
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    sessionStorage.setItem(TAB_INSTANCE_ID_KEY, tabId);
  }

  // Page marker persists across page refreshes in the same tab
  // If there's a page marker, this is either a refresh or a legitimate session
  // No need to detect duplication this way - just let sessionStorage handle it

  return { sessionId, isDuplicatedTab };
}

// Verify the session ID is still valid for this tab
export function isSessionValid() {
  return sessionStorage.getItem(SESSION_ID_KEY) !== null;
}

export function readAuthUser() {
  try {
    // Check if session is still valid (tab still has its session ID)
    if (!isSessionValid()) {
      return null;
    }
    const stored = sessionStorage.getItem(AUTH_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function writeAuthUser(user) {
  // Don't call getOrCreateSessionId() here - it's already initialized
  // Just store the user data
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  localStorage.removeItem(AUTH_USER_KEY);
}

export function clearAuthUser() {
  // Only clear the user auth data, NOT the session IDs
  // This preserves the session so the user can log in again
  sessionStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}
