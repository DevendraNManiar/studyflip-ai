import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-nexcart-secret-key-development';

export function signToken(payload: any, options?: jwt.SignOptions) {
  return jwt.sign(payload, JWT_SECRET, options || { expiresIn: '1d' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (e) {
    return null;
  }
}
