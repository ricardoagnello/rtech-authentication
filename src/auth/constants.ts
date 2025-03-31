export const JWT_SECRET = process.env.JWT_SECRET || 'secretKey';
export const JWT_EXPIRATION = '15m';
export const REFRESH_TOKEN_EXPIRATION = '7d';
export const RESET_TOKEN_EXPIRATION = '1h';
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
export const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;
export const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';