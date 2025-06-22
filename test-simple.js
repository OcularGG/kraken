// Test the simple test endpoint
const testEndpoint = async () => {
  const TEST_URL = 'https://kraken-cx1d.vercel.app/api/test';
  
  console.log('Testing test endpoint...');
  console.log('URL:', TEST_URL);
  
  try {
    const response = await fetch(TEST_URL);
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test endpoint working:', result);
    } else {
      const errorText = await response.text();
      console.error('❌ Test endpoint failed:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

testEndpoint();
