require('dotenv').config();
const { verifyToken } = require('@clerk/express');

console.log('🔍 JWT Debug Tool');
console.log('================');

// Check environment variables
console.log('\n1️⃣ Environment Variables:');
console.log('CLERK_PUBLISHABLE_KEY:', process.env.CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing');
console.log('CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Missing');
console.log('CLERK_JWT_ISSUER_DOMAIN:', process.env.CLERK_JWT_ISSUER_DOMAIN || '❌ Not set');
console.log('CLERK_JWT_ISSUER:', process.env.CLERK_JWT_ISSUER || '❌ Not set');

// Extract domain from publishable key
if (process.env.CLERK_PUBLISHABLE_KEY) {
  try {
    const pubKey = process.env.CLERK_PUBLISHABLE_KEY;
    const decoded = Buffer.from(pubKey.replace('pk_test_', ''), 'base64').toString('utf-8');
    console.log('Decoded domain from pub key:', decoded);
  } catch (e) {
    console.log('Could not decode publishable key');
  }
}

console.log('\n2️⃣ Expected JWT Configuration:');
console.log('Your JWT tokens should have:');
console.log('- Issuer (iss):', 'https://mint-turkey-12.clerk.accounts.dev');
console.log('- Audience (aud):', 'Should match your frontend domain or be empty');

console.log('\n3️⃣ Common Issues and Solutions:');
console.log('❌ "Failed to resolve JWK during verification" usually means:');
console.log('   → Token is using wrong JWT template');
console.log('   → Frontend is not using the correct template name');
console.log('   → Template configuration is incorrect');
console.log('   → Environment mismatch (dev vs prod)');

console.log('\n4️⃣ JWT Template Checklist:');
console.log('In your Clerk dashboard, verify:');
console.log('   ✓ JWT template name: "hell"');
console.log('   ✓ Template is enabled');
console.log('   ✓ Claims configuration is correct');
console.log('   ✓ Audience setting matches your app');

console.log('\n5️⃣ Frontend Token Generation:');
console.log('Your frontend should generate tokens like this:');
console.log('```javascript');
console.log('const { getToken } = useAuth();');
console.log('const token = await getToken({ template: "hell" });');
console.log('// NOT: const token = await getToken(); // This uses default template');
console.log('```');

console.log('\n6️⃣ Manual Token Test:');
console.log('To test manually:');
console.log('1. Generate token in frontend with: getToken({ template: "hell" })');
console.log('2. Copy the token');
console.log('3. Test with: node debug-jwt.js "YOUR_TOKEN_HERE"');

// If token provided as command line argument
const testToken = process.argv[2];
if (testToken) {
  console.log('\n🧪 Testing provided token...');
  testTokenManually(testToken);
}

async function testTokenManually(token) {
  try {
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 50) + '...');
    
    // Decode without verification
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        console.log('\n📋 Token Structure:');
        console.log('Header:', header);
        console.log('Payload preview:', {
          iss: payload.iss,
          aud: payload.aud,
          sub: payload.sub,
          exp: payload.exp,
          iat: payload.iat,
          azp: payload.azp,
          template: payload.template || 'default'
        });
        
        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        const isExpired = now > payload.exp;
        console.log('\n⏰ Expiration Check:');
        console.log('Current time:', new Date(now * 1000).toISOString());
        console.log('Token expires:', new Date(payload.exp * 1000).toISOString());
        console.log('Is expired:', isExpired ? '❌ YES' : '✅ NO');
        
        // Check issuer
        console.log('\n🔍 Issuer Check:');
        console.log('Token issuer:', payload.iss);
        console.log('Expected:', process.env.CLERK_JWT_ISSUER || 'https://mint-turkey-12.clerk.accounts.dev');
        console.log('Matches:', payload.iss === (process.env.CLERK_JWT_ISSUER || 'https://mint-turkey-12.clerk.accounts.dev') ? '✅ YES' : '❌ NO');
        
      } catch (e) {
        console.log('❌ Could not decode token parts:', e.message);
      }
    }
    
    // Try verification
    console.log('\n🔐 Attempting Clerk Verification...');
    const verified = await verifyToken(token, {});
    console.log('✅ SUCCESS! Token is valid');
    console.log('Verified payload:', {
      userId: verified.sub,
      email: verified.email,
      template: verified.template || 'default'
    });
    
  } catch (error) {
    console.log('❌ Verification failed:', error.message);
    
    if (error.message.includes('JWK')) {
      console.log('\n💡 JWK Resolution Failed - Possible fixes:');
      console.log('1. Check if JWT template "hell" exists and is enabled');
      console.log('2. Verify frontend is using correct template: getToken({ template: "hell" })');
      console.log('3. Check network connectivity to Clerk');
      console.log('4. Verify environment variables match your Clerk project');
    }
    
    if (error.message.includes('expired')) {
      console.log('\n💡 Token expired - Generate a new one');
    }
    
    if (error.message.includes('audience')) {
      console.log('\n💡 Audience mismatch - Check JWT template audience settings');
    }
  }
}

console.log('\n📚 Next Steps:');
console.log('1. Check Clerk Dashboard → JWT Templates → "hell"');
console.log('2. Verify frontend uses: getToken({ template: "hell" })');
console.log('3. Test with fresh token: node debug-jwt.js "TOKEN_HERE"');
console.log('4. Use POST /api/debug-token endpoint for real-time debugging');
