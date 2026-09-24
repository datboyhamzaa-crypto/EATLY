import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

import { loginRequest, meRequest, registerRequest } from "@/src/api/auth";
import { TOKEN_KEY } from "@/src/api/client";
import { PublicUser } from "@/src/types";
import { storage } from "@/src/utils/storage";

type AuthState = {
  user: PublicUser | null;
  booting: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await storage.secureGet(TOKEN_KEY, "");
      if (token) {
        try {
          const me = await meRequest();
          setUser(me);
        } catch {
          await storage.secureRemove(TOKEN_KEY);
        }
      }
      setBooting(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginRequest(email.trim().toLowerCase(), password);
    await storage.secureSet(TOKEN_KEY, res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await registerRequest(name.trim(), email.trim().toLowerCase(), password);
    await storage.secureSet(TOKEN_KEY, res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await storage.secureRemove(TOKEN_KEY);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await meRequest();
      setUser(me);
    } catch {
      // keep existing
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, booting, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
