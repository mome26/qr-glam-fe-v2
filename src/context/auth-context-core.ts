import { createContext } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isDefaultPassword?: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
