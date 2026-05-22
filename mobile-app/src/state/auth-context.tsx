import React, { createContext, useContext, useMemo, useState } from "react";

type AuthUser = {
  id: string;
  fullName: string;
  roles: number[];
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
};

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  signIn: (payload: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    user: null
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.accessToken && state.user),
      signIn: ({ accessToken, refreshToken, user }) =>
        setState({ accessToken, refreshToken, user }),
      signOut: () => setState({ accessToken: null, refreshToken: null, user: null })
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
