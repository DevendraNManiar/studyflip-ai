import { cookies } from 'next/headers';
import { verifyToken } from './jwt';
import { dbService } from './dbWrapper';

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nexcart_session')?.value;
    
    if (!token) return null;
    
    const decoded = verifyToken(token);
    if (!decoded) return null;
    
    const user = await dbService.getUserByEmail(decoded.email);
    if (!user) return null;
    
    // Return safe user details (no password hash)
    const { password, ...safeUser } = user as any;
    return safeUser;
  } catch (e) {
    console.error("Error retrieving session user:", e);
    return null;
  }
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user && user.role === 'ADMIN';
}
