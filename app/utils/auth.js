// utils/auth.js
export function getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }
  
  export function handleAuthError(error) {
    console.error('Auth error:', error);
    return {
      error: error.message || 'An error occurred during authentication'
    };
  }
  
  export function validateEmail(email) {
    const regex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    return regex.test(email);
  }
  
  export function validatePassword(password) {
    // Password must be at least 6 characters
    return password.length >= 6;
  }
  
  export async function verifyAuth(request) {
    const token = request.cookies.get('auth-token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
  
    try {
      // Verify token using jose
      const { payload } = await jwtVerify(
        token.value,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
  
      return payload;
    } catch (error) {
      throw new Error('Invalid authentication token');
    }
  }
