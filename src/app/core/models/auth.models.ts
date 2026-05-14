export interface User {
  email: string;
  roles: string[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  roles: string[];
  email?: string;
}
