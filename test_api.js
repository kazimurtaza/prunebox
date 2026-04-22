const API_BASE = 'http://localhost:3000';

// Test rollup settings API
async function testRollupSettings() {
  console.log('Testing rollup settings API...');

  // Test GET
  try {
    const response = await fetch(`${API_BASE}/api/rollup/settings`, {
      headers: {
        'Cookie': 'next-auth.session-token=dev-session-token'
      }
    });

    const data = await response.json();
    console.log('GET Response:', response.status, data);

    if (response.ok) {
      // Test PUT with updated settings
      const updateData = {
        enabled: true,
        deliverySlot: 'EVENING',
        timezone: 'America/New_York',
        digestName: 'My Evening Digest'
      };

      const putResponse = await fetch(`${API_BASE}/api/rollup/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=dev-session-token'
        },
        body: JSON.stringify(updateData)
      });

      const putData = await putResponse.json();
      console.log('PUT Response:', putResponse.status, putData);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testRollupSettings();