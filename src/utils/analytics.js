// Analytics and tracking utilities for eMetalWorks

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

// Generate unique visitor ID and session ID
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

// Get device information
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let device = 'desktop';
  
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    device = /iPad/i.test(userAgent) ? 'tablet' : 'mobile';
  }
  
  return {
    userAgent,
    device,
    screenResolution: {
      width: window.screen.width,
      height: window.screen.height
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };
};

// Track page visit - DISABLED (analytics removed per user request)
export const trackVisit = async (currentPage = 'home') => {
  // Analytics tracking disabled - no-op function
  return null;
};

// Track user interactions - DISABLED (analytics removed per user request)
export const trackInteraction = async (type, element, data = {}) => {
  // Analytics tracking disabled - no-op function
  return null;
};

// Track calculator usage
export const trackCalculatorUsage = async (calculatorData) => {
  return trackInteraction('calculator_use', 'calculator', {
    calculatorType: calculatorData.calculatorType || 'standard',
    grillType: calculatorData.grillType,
    metalType: calculatorData.metalType,
    profileType: calculatorData.profileType,
    dimensions: calculatorData.dimensions,
    estimatedWeight: calculatorData.estimatedWeight,
    estimatedCost: calculatorData.estimatedCost
  });
};

// Track tab switches
export const trackTabSwitch = async (fromTab, toTab) => {
  return trackInteraction('tab_switch', 'navigation_tabs', {
    fromTab,
    toTab,
    action: 'tab_change'
  });
};

// Track contact form interactions
export const trackContactFormInteraction = async (action, formData = {}) => {
  return trackInteraction('contact_form', 'contact_form', {
    action, // 'form_view', 'form_start', 'form_submit', 'form_error'
    formData: {
      hasName: !!formData.name,
      hasEmail: !!formData.email,
      hasPhone: !!formData.phone,
      hasSubject: !!formData.subject,
      hasMessage: !!formData.message,
      messageLength: formData.message?.length || 0
    }
  });
};

// Submit contact form
export const submitContactForm = async (formData) => {
  try {
    console.log('🚀 Starting contact form submission...');
    console.log('📍 API_BASE_URL:', API_BASE_URL);

    const visitorId = generateVisitorId();
    const sessionId = generateSessionId();

    const submissionData = {
      ...formData,
      sessionId,
      visitorId,
      source: formData.calculatorData ? 'calculator_quote' : 'website_contact'
    };

    console.log('📤 Submitting data:', JSON.stringify(submissionData, null, 2));

    const response = await fetch(`${API_BASE_URL}/api/contact/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData)
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors.map(err => err.message).join(', ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // If response is not JSON, use default error message
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ Contact form submitted successfully:', result);

    // Analytics tracking disabled - removed trackContactFormInteraction call

    return result;
  } catch (error) {
    console.error('❌ Error submitting contact form:', error);

    // Re-throw the error so the UI can handle it
    throw error;
  }
};

// Update visit duration - DISABLED (analytics removed per user request)
export const updateVisitDuration = async (timeOnSite, exitPage = null) => {
  // Analytics tracking disabled - no-op function
  return null;
};

// Initialize tracking - DISABLED (analytics removed per user request)
export const initializeTracking = () => {
  // Analytics tracking disabled - no-op function
  console.log('📊 Analytics tracking disabled');
};

// Export session info for use in components
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
