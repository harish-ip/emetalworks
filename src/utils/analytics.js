const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const host = window.location?.hostname || '';
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5001';
  }

  return 'https://emetalworks-backend.onrender.com';
};

const API_BASE_URL = resolveApiBaseUrl();
const apiUrl = (path) => `${API_BASE_URL}${path}`;

const logAnalyticsError = (eventName, error) => {
  if (import.meta.env.DEV) {
    console.debug(`Analytics ${eventName} failed:`, error);
  }
};

const hasTrackedThisSession = (eventName) => {
  const storageKey = `emetalworks_tracked_${eventName}`;

  try {
    if (sessionStorage.getItem(storageKey)) return true;
    sessionStorage.setItem(storageKey, 'true');
  } catch (error) {
    logAnalyticsError(`${eventName} session flag`, error);
  }

  return false;
};

const postAnalyticsEvent = (eventName, path, payload, { dedupe = true } = {}) => {
  if (dedupe && hasTrackedThisSession(eventName)) return;

  const url = apiUrl(path);
  const body = JSON.stringify(payload);

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(url, blob)) return;
    }
  } catch (error) {
    logAnalyticsError(eventName, error);
  }

  const sendFallback = () => {
    try {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true
      }).catch((error) => logAnalyticsError(eventName, error));
    } catch (error) {
      logAnalyticsError(eventName, error);
    }
  };

  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(sendFallback, { timeout: 1500 });
  } else {
    setTimeout(sendFallback, 0);
  }
};

// Storage can throw (private mode / disabled cookies). These helpers never throw,
// so analytics and — critically — the contact form submit can't be broken by it.
const memoryStore = {};

const safeStorageGet = (kind, key) => {
  try {
    const store = kind === 'local' ? window.localStorage : window.sessionStorage;
    return store ? store.getItem(key) : null;
  } catch (error) {
    return null;
  }
};

const safeStorageSet = (kind, key, value) => {
  try {
    const store = kind === 'local' ? window.localStorage : window.sessionStorage;
    if (store) store.setItem(key, value);
  } catch (error) {
    // Ignore — caller falls back to the in-memory copy.
  }
};

const randomId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const generateVisitorId = () => {
  let visitorId = safeStorageGet('local', 'emetalworks_visitor_id') || memoryStore.visitorId;
  if (!visitorId) {
    visitorId = randomId('visitor');
    memoryStore.visitorId = visitorId;
    safeStorageSet('local', 'emetalworks_visitor_id', visitorId);
  }
  return visitorId;
};

const generateSessionId = () => {
  let sessionId = safeStorageGet('session', 'emetalworks_session_id') || memoryStore.sessionId;
  if (!sessionId) {
    sessionId = randomId('session');
    memoryStore.sessionId = sessionId;
    safeStorageSet('session', 'emetalworks_session_id', sessionId);
  }
  return sessionId;
};

const getBaseAnalyticsPayload = () => ({
  visitorId: generateVisitorId(),
  sessionId: generateSessionId(),
  path: typeof window !== 'undefined' ? window.location.pathname : '/',
  referrer: typeof document !== 'undefined' ? document.referrer : ''
});

export const trackVisit = () => {
  // dedupe:false -> every page load counts as a hit (raw daily hits).
  // Unique-visitor counting is handled server-side via the session record.
  postAnalyticsEvent('visit', '/api/analytics/visit', getBaseAnalyticsPayload(), { dedupe: false });
};

export const trackCalculatorUsage = () => null;

export const trackCalculatorPageVisit = () => {
  // dedupe:false -> every calculator open counts (raw daily opens).
  // Unique-visitor counting is handled server-side via the session record.
  postAnalyticsEvent('calculator_page', '/api/analytics/calculator', getBaseAnalyticsPayload(), { dedupe: false });
};

export const trackTabSwitch = (oldTab, newTab) => {
  if (oldTab !== 'calculator' && newTab === 'calculator') {
    return trackCalculatorPageVisit();
  }

  return null;
};

export const trackContactFormInteraction = () => null;

export const trackInteraction = () => null;

export const initializeTracking = () => {
  trackVisit();
};

// Submit contact form
export const submitContactForm = async (formData) => {
  const visitorId = generateVisitorId();
  const sessionId = generateSessionId();

  const submissionData = {
    ...formData,
    sessionId,
    visitorId,
    source: formData.calculatorData ? 'calculator_quote' : 'website_contact'
  };

  const response = await fetch(apiUrl('/api/contact/submit'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(submissionData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
  }

  return response.json();
};

export const getSessionInfo = () => ({
  visitorId: generateVisitorId(),
  sessionId: generateSessionId()
});

export default {
  trackVisit,
  trackCalculatorUsage,
  trackCalculatorPageVisit,
  trackTabSwitch,
  trackContactFormInteraction,
  trackInteraction,
  submitContactForm,
  initializeTracking,
  getSessionInfo
};
