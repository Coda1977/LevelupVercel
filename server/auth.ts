/**
 * Simple authentication middleware for Supabase
 */

export async function setupAuth(app: any) {
  // Auth is handled by Supabase on the client side
  // This is a placeholder for server-side auth if needed
  console.log('Auth middleware initialized');
}

export async function isAuthenticated(req: any, res: any, next: any) {
  // For now, pass through - Supabase handles auth on client
  // In production, verify Supabase JWT token here
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    // For development, allow requests without auth
    // In production, uncomment the following:
    // return res.status(401).json({ message: 'No authorization header' });
  }
  
  // TODO: Verify Supabase JWT token
  // const token = authHeader.replace('Bearer ', '');
  // const user = await verifySupabaseToken(token);
  // req.user = user;
  
  // For now, mock user for development
  req.user = { 
    claims: { 
      sub: 'development-user-id',
      email: 'test@example.com'
    } 
  };
  
  next();
}