// Test the Vercel deployment status
const testVercelDeployment = async () => {
  const urls = [
    'https://kraken-oculargg.vercel.app',
    'https://kraken-oculargg.vercel.app/api/discord-webhook',
    'https://kraken.vercel.app/api/discord-webhook'  // Alternative URL format
  ];

  for (const url of urls) {
    console.log(`\nTesting: ${url}`);
    try {
      const response = await fetch(url, {
        method: url.includes('/api/') ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: url.includes('/api/') ? JSON.stringify({ test: true }) : undefined
      });
      
      console.log(`Status: ${response.status}`);
      console.log(`Headers:`, Object.fromEntries(response.headers));
      
      const text = await response.text();
      console.log(`Body:`, text.substring(0, 200) + (text.length > 200 ? '...' : ''));
      
    } catch (error) {
      console.error(`Error:`, error.message);
    }
  }
};

testVercelDeployment();
