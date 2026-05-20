const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('🧪 Testing ADK Chat Backend API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);

    // Test session creation
    console.log('\n2. Testing session creation...');
    const sessionResponse = await axios.post(`${BASE_URL}/sessions`, {
      userId: 'test-user-123',
      initialState: { test: 'data' }
    });
    console.log('✅ Session created:', sessionResponse.data);
    const sessionId = sessionResponse.data.sessionId;

    // Test chat endpoint
    console.log('\n3. Testing chat endpoint...');
    const chatResponse = await axios.post(`${BASE_URL}/chat`, {
      userId: 'test-user-123',
      sessionId: sessionId,
      message: 'Hello, this is a test message!'
    });
    console.log('✅ Chat response received:', chatResponse.data);

    // Test chat history
    console.log('\n4. Testing chat history...');
    const historyResponse = await axios.get(`${BASE_URL}/sessions/${sessionId}/history`);
    console.log('✅ Chat history retrieved:', historyResponse.data);

    // Test get session
    console.log('\n5. Testing get session...');
    const getSessionResponse = await axios.get(`${BASE_URL}/sessions/${sessionId}`);
    console.log('✅ Session retrieved:', getSessionResponse.data);

    // Test update session state
    console.log('\n6. Testing update session state...');
    const updateStateResponse = await axios.put(`${BASE_URL}/sessions/${sessionId}/state`, {
      stateDelta: { updated: true, timestamp: new Date().toISOString() }
    });
    console.log('✅ Session state updated:', updateStateResponse.data);

    // Test get user sessions
    console.log('\n7. Testing get user sessions...');
    const userSessionsResponse = await axios.get(`${BASE_URL}/sessions/user/test-user-123`);
    console.log('✅ User sessions retrieved:', userSessionsResponse.data);

    console.log('\n🎉 All tests passed! The API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the server is running on port 3000:');
      console.log('   npm start');
    }
    
    if (error.response?.status === 500) {
      console.log('\n💡 Check your Firebase configuration and ADK agents connection.');
    }
  }
}

// Run tests
testAPI(); 