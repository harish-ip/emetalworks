const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5007';

export const submitContactForm = async (formData) => {
  try {
    console.log('🚀 Starting contact form submission...');
    console.log('📍 API_BASE_URL:', API_BASE_URL);

    const submissionData = {
      ...formData,
      source: formData.calculatorData ? 'calculator_quote' : 'website_contact'
    };

    console.log('📤 Submitting data:', JSON.stringify(submissionData, null, 2));
    console.log('🎯 Target URL:', `${API_BASE_URL}/contact/submit`);

    const response = await fetch(`${API_BASE_URL}/contact/submit`, {
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
    
    return result;
  } catch (error) {
    console.error('❌ Error submitting contact form:', error);
    throw error;
  }
};
