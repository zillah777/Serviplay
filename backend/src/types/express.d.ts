import { Request } from 'express';

// Extender el objeto Request de Express para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        tipo_usuario: 'as' | 'explorador' | 'ambos';
        iat?: number;
        exp?: number;
      };
    }
  }
}

export {};