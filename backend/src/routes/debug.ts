import { Router } from 'express';
import { verifyToken } from '@clerk/express';

const router = Router();

// Debug endpoint to test token validation step by step
router.post('/debug-token', async (req, res) => {
  try {
    console.log('\n=== 🐛 TOKEN DEBUG SESSION STARTED ===');
    
    // Step 1: Check Authorization header
    const authHeader = req.headers.authorization;
    console.log('1️⃣ [DEBUG] Authorization header:', authHeader ? '✅ Present' : '❌ Missing');
    console.log('   Full header:', authHeader);
    
    if (!authHeader) {
      return res.status(400).json({
        error: 'Missing Authorization header',
        expected: 'Authorization: Bearer <token>',
        received: 'No Authorization header'
      });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(400).json({
        error: 'Invalid Authorization header format',
        expected: 'Authorization: Bearer <token>',
        received: authHeader
      });
    }
    
    // Step 2: Extract token
    const token = authHeader.replace('Bearer ', '').trim();
    console.log('2️⃣ [DEBUG] Token extracted:');
    console.log('   Length:', token.length);
    console.log('   First 20 chars:', token.substring(0, 20) + '...');
    console.log('   Last 20 chars:', '...' + token.substring(token.length - 20));
    
    if (token.length === 0) {
      return res.status(400).json({
        error: 'Empty token',
        message: 'Token was empty after removing Bearer prefix'
      });
    }
    
    // Step 3: Check environment variables
    console.log('3️⃣ [DEBUG] Environment check:');
    console.log('   CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Missing');
    console.log('   CLERK_PUBLISHABLE_KEY:', process.env.CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing');
    
    // Step 4: Try to decode token without verification (just to see structure)
    try {
      const tokenParts = token.split('.');
      console.log('4️⃣ [DEBUG] Token structure:');
      console.log('   Parts count:', tokenParts.length, '(should be 3)');
      
      if (tokenParts.length === 3) {
        // Decode header (first part)
        try {
          const header = JSON.parse(atob(tokenParts[0]));
          console.log('   Header:', header);
        } catch (e) {
          console.log('   Header: Could not decode');
        }
        
        // Decode payload (second part)
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('   Payload preview:', {
            iss: payload.iss,
            sub: payload.sub,
            aud: payload.aud,
            exp: payload.exp,
            iat: payload.iat,
            nbf: payload.nbf
          });
          
          // Check expiration
          const now = Math.floor(Date.now() / 1000);
          console.log('   Expiration check:');
          console.log('     Current time:', now);
          console.log('     Token exp:', payload.exp);
          console.log('     Is expired:', now > payload.exp ? '❌ YES' : '✅ NO');
          
        } catch (e) {
          console.log('   Payload: Could not decode');
        }
      }
    } catch (e) {
      console.log('4️⃣ [DEBUG] Could not analyze token structure');
    }
    
    // Step 5: Try Clerk verification
    console.log('5️⃣ [DEBUG] Attempting Clerk verification...');
    try {
      const verifiedPayload = await verifyToken(token, {
            jwtKey: process.env.CLERK_JWT_KEY || "hell", 

      });
      console.log('✅ [DEBUG] Token verification SUCCESS!');
      console.log('   Verified payload:', {
        sub: verifiedPayload.sub,
        email: verifiedPayload.email,
        iss: verifiedPayload.iss,
        aud: verifiedPayload.aud
      });
      
      res.json({
        success: true,
        message: 'Token is valid!',
        payload: {
          userId: verifiedPayload.sub,
          email: verifiedPayload.email,
          issuer: verifiedPayload.iss,
          audience: verifiedPayload.aud,
          issuedAt: new Date(verifiedPayload.iat * 1000).toISOString(),
          expiresAt: new Date(verifiedPayload.exp * 1000).toISOString()
        }
      });
      
    } catch (verifyError) {
      console.log('❌ [DEBUG] Token verification FAILED:');
      console.log('   Error:', verifyError instanceof Error ? verifyError.message : verifyError);
      console.log('   Stack:', verifyError instanceof Error ? verifyError.stack : 'No stack trace');
      
      res.status(401).json({
        error: 'Token verification failed',
        details: verifyError instanceof Error ? verifyError.message : 'Unknown error',
        possibleCauses: [
          'Token is expired',
          'Token is malformed',
          'Wrong Clerk project/environment',
          'Invalid JWT template configuration',
          'Network issues with Clerk',
          'Environment variables misconfigured'
        ]
      });
    }
    
    console.log('=== 🐛 TOKEN DEBUG SESSION ENDED ===\n');
    
  } catch (error) {
    console.error('❌ [DEBUG] Unexpected error in debug endpoint:', error);
    res.status(500).json({
      error: 'Debug endpoint error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
