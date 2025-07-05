// Test contact form submission
const testContactSubmission = async () => {
  const testData = {
    name: "Test User",
    email: "test@example.com",
    phone: "1234567890",
    subject: "Test Message",
    message: "This is a test message from the contact form",
    projectType: "Grill Work",
    sessionId: "test-session-123",
    visitorId: "test-visitor-456",
    source: "website_contact"
  };

  try {
    console.log('Testing contact form submission...');
    console.log('Sending data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:5007/api/contact/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const result = await response.json();
    console.log('Response data:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Contact form submission successful!');
    } else {
      console.log('❌ Contact form submission failed!');
    }
    
  } catch (error) {
    console.error('❌ Error testing contact form:', error);
  }
};

testContactSubmission();
