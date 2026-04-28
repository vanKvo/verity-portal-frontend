export interface User {
  email: string;
  role: 'user' | 'guest' | 'admin';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: 'user' | 'guest' | 'admin';
  email?: string;
}
