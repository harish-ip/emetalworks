// Quick test to check if API endpoints are working
const testEndpoints = async () => {
  const baseUrl = 'http://localhost:5006';
  
  console.log('Testing API endpoints...');
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    console.log('Health response:', healthData);
    
    // Test admin dashboard endpoint
    console.log('\n2. Testing admin dashboard endpoint...');
    const dashboardResponse = await fetch(`${baseUrl}/api/admin/dashboard`);
    const dashboardData = await dashboardResponse.json();
    console.log('Dashboard response:', dashboardData);
    
    // Test contact submissions endpoint
    console.log('\n3. Testing contact submissions endpoint...');
    const contactsResponse = await fetch(`${baseUrl}/api/contact/submissions`);
    const contactsData = await contactsResponse.json();
    console.log('Contacts response:', contactsData);
    
  } catch (error) {
    console.error('Error testing endpoints:', error);
  }
};

testEndpoints();
