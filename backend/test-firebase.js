require('dotenv').config();
const { initializeFirebase, getFirestore } = require('./config/firebase');

async function testFirebase() {
  console.log('🧪 Testing Firebase Connection...\n');

  try {
    // Initialize Firebase
    console.log('1. Initializing Firebase...');
    const app = initializeFirebase();
    console.log('✅ Firebase initialized successfully');

    // Test Firestore connection
    console.log('\n2. Testing Firestore connection...');
    const db = getFirestore();
    console.log('✅ Firestore connection established');

    // Test write operation
    console.log('\n3. Testing write operation...');
    const testDoc = db.collection('test').doc('connection-test');
    await testDoc.set({
      timestamp: new Date(),
      message: 'Firebase connection test successful',
      test: true
    });
    console.log('✅ Write operation successful');

    // Test read operation
    console.log('\n4. Testing read operation...');
    const doc = await testDoc.get();
    if (doc.exists) {
      console.log('✅ Read operation successful');
      console.log('📄 Document data:', doc.data());
    } else {
      console.log('❌ Document not found');
    }

    // Clean up test document
    console.log('\n5. Cleaning up test document...');
    await testDoc.delete();
    console.log('✅ Test document deleted');

    console.log('\n🎉 Firebase setup is working correctly!');
    console.log('📊 Your backend will now use Firestore for persistent storage.');

  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
    
    if (error.code === 'app/no-app') {
      console.log('\n💡 Make sure you have:');
      console.log('   1. Downloaded firebase-service-account.json');
      console.log('   2. Created .env file with correct settings');
      console.log('   3. Placed firebase-service-account.json in project root');
    }
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Check your Firestore rules in Firebase Console');
    }
  }
}

// Run the test
testFirebase(); 