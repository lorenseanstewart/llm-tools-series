import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends FastifyRequest {
  userId?: string;
  serviceId?: string;
}

export async function authenticateToken(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return reply.status(401).send({ error: 'Access token required' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // For service-to-service communication, you might have serviceId instead of userId
    request.userId = decoded.userId || decoded.sub;
    request.serviceId = decoded.serviceId;
    
  } catch (error) {
    return reply.status(403).send({ error: 'Invalid or expired token' });
  }
}