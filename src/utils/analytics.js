// Analytics disabled intentionally.
// Keep only contact form submission helpers.

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

  return 'https://emetalworks-backend.onrender.com';
};

const API_BASE_URL = resolveApiBaseUrl();
const apiUrl = (path) => `${API_BASE_URL}${path}`;

const generateVisitorId = () => {
  let visitorId = localStorage.getItem('emetalworks_visitor_id');
  if (!visitorId) {
    visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('emetalworks_visitor_id', visitorId);
  }
  return visitorId;
};

const generateSessionId = () => {
  let sessionId = sessionStorage.getItem('emetalworks_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('emetalworks_session_id', sessionId);
  }
  return sessionId;
};

// No-op tracking functions.
export const trackVisit = async () => null;
export const trackInteraction = async () => null;
export const trackCalculatorUsage = async () => null;
export const trackTabSwitch = async () => null;
export const trackContactFormInteraction = async () => null;
export const updateVisitDuration = async () => null;
export const initializeTracking = () => {};

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
  trackInteraction,
  trackCalculatorUsage,
  trackTabSwitch,
  trackContactFormInteraction,
  submitContactForm,
  updateVisitDuration,
  initializeTracking,
  getSessionInfo
};