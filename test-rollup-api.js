const API_BASE = 'http://localhost:3000';

async function testRollupSettingsAPI() {
  console.log('Testing rollup settings API...');

  // First, create a test user via the API (simulate auth)
  const createUserRes = await fetch(`${API_BASE}/api/test/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@example.com',
      name: 'Test User'
    })
  });

  if (createUserRes.ok) {
    const userData = await createUserRes.json();
    const sessionId = userData.sessionId;

    // Test GET
    console.log('\n1. Testing GET request...');
    const getRes = await fetch(`${API_BASE}/api/rollup/settings`, {
      headers: {
        'Cookie': `next-auth.session-token=${sessionId}`
      }
    });

    console.log('GET Status:', getRes.status);

    if (getRes.ok) {
      const getData = await getRes.json();
      console.log('GET Response:', getData);

      // Test PUT
      console.log('\n2. Testing PUT request...');
      const putData = {
        enabled: true,
        deliverySlot: 'EVENING',
        timezone: 'America/New_York',
        digestName: 'My Evening Digest'
      };

      const putRes = await fetch(`${API_BASE}/api/rollup/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `next-auth.session-token=${sessionId}`
        },
        body: JSON.stringify(putData)
      });

      console.log('PUT Status:', putRes.status);

      if (putRes.ok) {
        const putResponse = await putRes.json();
        console.log('PUT Response:', putResponse);

        // Verify the update was successful by doing another GET
        console.log('\n3. Verifying update with GET...');
        const verifyRes = await fetch(`${API_BASE}/api/rollup/settings`, {
          headers: {
            'Cookie': `next-auth.session-token=${sessionId}`
          }
        });

        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          console.log('Verified Response:', verifyData);

          // Check if the digestName was updated correctly
          if (verifyData.digestName === 'My Evening Digest') {
            console.log('\n✅ All tests passed!');
            return true;
          } else {
            console.log('\n❌ Update verification failed');
            return false;
          }
        }
      }
    }
  }

  console.log('\n❌ Tests failed');
  return false;
}

testRollupSettingsAPI();