// Analytics and tracking utilities for eMetalWorks

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5007';

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

// Track page visit
export const trackVisit = async (currentPage = 'home') => {
  try {
    const visitorId = generateVisitorId();
    const sessionId = generateSessionId();
    const deviceInfo = getDeviceInfo();
    
    const visitData = {
      sessionId,
      visitorId,
      currentPage,
      referrer: document.referrer || 'direct',
      ...deviceInfo
    };
    
    const response = await fetch(`${API_BASE_URL}/tracking/visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visitData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Visit tracked:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error tracking visit:', error);
    return null;
  }
};

// Track user interactions
export const trackInteraction = async (type, element, data = {}) => {
  try {
    const sessionId = generateSessionId();
    
    const interactionData = {
      sessionId,
      type,
      element,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };
    
    const response = await fetch(`${API_BASE_URL}/tracking/interaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(interactionData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Interaction tracked:', type, element);
    
    return result;
  } catch (error) {
    console.error('❌ Error tracking interaction:', error);
    return null;
  }
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
    console.log('🎯 Target URL:', `${API_BASE_URL}/api/contact/submit`);

    const response = await fetch(`${API_BASE_URL}/api/contact/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    if (!response.ok) {
      console.error('❌ Response not ok, status:', response.status);
      const errorText = await response.text();
      console.error('❌ Error response text:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Contact form submitted successfully:', result);
    
    // Track successful submission
    await trackContactFormInteraction('form_submit', formData);
    
    return result;
  } catch (error) {
    console.error('❌ Error submitting contact form:', error);
    
    // Track form error
    await trackContactFormInteraction('form_error', { error: error.message });
    
    throw error;
  }
};

// Update visit duration (call this when user is about to leave)
export const updateVisitDuration = async (timeOnSite, exitPage = null) => {
  try {
    const sessionId = generateSessionId();
    
    const response = await fetch(`${API_BASE_URL}/tracking/visit/${sessionId}/duration`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeOnSite: Math.round(timeOnSite / 1000), // Convert to seconds
        exitPage
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Visit duration updated:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error updating visit duration:', error);
    return null;
  }
};

// Initialize tracking when the app loads
export const initializeTracking = () => {
  // Track initial page visit
  trackVisit('home');
  
  // Track page visibility changes
  let startTime = Date.now();
  let isVisible = !document.hidden;
  
  const handleVisibilityChange = () => {
    if (document.hidden && isVisible) {
      // Page became hidden
      const timeSpent = Date.now() - startTime;
      updateVisitDuration(timeSpent);
      isVisible = false;
    } else if (!document.hidden && !isVisible) {
      // Page became visible
      startTime = Date.now();
      isVisible = true;
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Track page unload
  const handleBeforeUnload = () => {
    if (isVisible) {
      const timeSpent = Date.now() - startTime;
      updateVisitDuration(timeSpent, window.location.pathname);
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Track scroll interactions (throttled)
  let scrollTimeout;
  const handleScroll = () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > 0 && scrollPercent % 25 === 0) {
        trackInteraction('scroll', 'page', { scrollPercent });
      }
    }, 1000);
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  console.log('🚀 eMetalWorks tracking initialized');
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
