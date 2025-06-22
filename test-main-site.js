// Test if the main site loads
const testMainSite = async () => {
  const url = 'https://kraken-cx1d.vercel.app/';
  
  console.log(`Testing main site: ${url}`);
  
  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers));
    
    if (response.ok) {
      const html = await response.text();
      console.log(`✅ Main site loads successfully`);
      console.log(`Title found:`, html.includes('<title>KRAKEN | Naval Action RvR Clan</title>'));
      console.log(`Apply form exists:`, html.includes('apply.html'));
    } else {
      console.error(`❌ Main site failed to load`);
    }
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
};

testMainSite();
