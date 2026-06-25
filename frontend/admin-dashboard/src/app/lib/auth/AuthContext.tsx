import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { tokenStore } from "../tokenStore";
import { isAdminToken } from "../jwtDecode";
import { authApi, type CurrentUser } from "./authApi";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: CurrentUser | null;
  /** Returns nothing on success; throws ApiError on failure. */
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<CurrentUser | null>(null);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const loadCurrentUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
      setStatus("authenticated");
    } catch {
      tokenStore.clear();
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await authApi.login(email, password);
      tokenStore.setTokens(tokens.accessToken, tokens.refreshToken);
      await loadCurrentUser();
    },
    [loadCurrentUser],
  );

  // On startup, restore the session if an *admin* token is present. A non-admin
  // token (e.g. leaked from the user app via a shared device) is cleared so it
  // can't silently sign an end-user into the admin dashboard.
  useEffect(() => {
    const token = tokenStore.getAccessToken();
    if (token && isAdminToken(token)) {
      void loadCurrentUser();
    } else {
      tokenStore.clear();
      setStatus("unauthenticated");
    }
  }, [loadCurrentUser]);

  // React to a 401 anywhere in the app (token expired / revoked).
  useEffect(() => {
    function handleUnauthorized() {
      // Flag it so the login screen can tell the admin their session expired
      // (rather than silently bouncing them back to the sign-in form).
      try { sessionStorage.setItem("subl.sessionExpired", "1"); } catch { /* no-op */ }
      setUser(null);
      setStatus("unauthenticated");
    }
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
