import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}