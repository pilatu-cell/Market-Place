import JWT from 'jsonwebtoken';
import { config } from './config.js';

export async function cookieChecker(req, res, next) {
  const token = req.cookies.cookie;
  // console.log('Cookies received:', req.cookies);

  if (!token) {
    return res.status(401).json({ error: 'Session expired. Login to create a session' });
  }

  try {
    const decode = JWT.verify(token, config.secret_key);
    req.user = decode;
    next();
  } catch (error) {
    console.error('Invalid JWT:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
