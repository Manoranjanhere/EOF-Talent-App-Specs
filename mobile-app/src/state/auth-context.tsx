import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { GroupId } from "@eof/shared";
import { getProfile } from "../services/profile.service";
import { refreshAccessToken } from "../services/auth.service";
import { setAccessTokenRefreshHandler } from "../services/api-client";
import {
  clearSession,
  loadSession,
  saveSession,
  type PersistedSession
} from "../services/session-storage";

type AuthUser = {
  id: string;
  fullName: string;
  roles: number[];
};

export type OnboardingKind = "talent" | "employer" | null;

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  onboarding: OnboardingKind;
  checkingProfile: boolean;
  restoringSession: boolean;
};

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  signIn: (payload: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    /** Skip profile completeness check (caller already completed onboarding). */
    profileComplete?: boolean;
  }) => Promise<void>;
  completeOnboarding: () => void;
  refreshOnboardingStatus: () => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function detectOnboarding(user: AuthUser, profile: any): OnboardingKind {
  const roles = user.roles ?? [];
  const isTalent = roles.includes(GroupId.Talent);
  const isEmployer = roles.includes(GroupId.TalentEmployerOrAgency);

  if (isTalent) {
    const hasPhoto =
      Boolean(profile?.profilePhotoAssetId) ||
      Boolean(profile?.profilePhotoObjectKey) ||
      Boolean(profile?.mediaAssets?.some((m: any) => m.isProfilePhoto));
    if (!hasPhoto) return "talent";
  }

  if (isEmployer) {
    const hasPhoto =
      Boolean(profile?.profilePhotoAssetId) ||
      Boolean(profile?.profilePhotoObjectKey) ||
      Boolean(profile?.mediaAssets?.some((m: any) => m.isProfilePhoto));
    if (!hasPhoto) return "employer";
    if (!profile?.profileOrg?.legalName || !profile?.profileOrg?.addressLine) {
      return "employer";
    }
  }

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    user: null,
    onboarding: null,
    checkingProfile: false,
    restoringSession: true
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const persist = useCallback(async (session: PersistedSession) => {
    await saveSession(session);
  }, []);

  const signOut = useCallback(() => {
    void clearSession();
    setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      onboarding: null,
      checkingProfile: false,
      restoringSession: false
    });
  }, []);

  const refreshOnboardingStatus = useCallback(async () => {
    const { accessToken, user } = stateRef.current;
    if (!accessToken || !user) return;
    try {
      setState((prev) => ({ ...prev, checkingProfile: true }));
      const profile = await getProfile(user.id, accessToken);
      const onboarding = detectOnboarding(user, profile);
      setState((prev) => ({ ...prev, onboarding, checkingProfile: false }));
    } catch {
      setState((prev) => ({ ...prev, checkingProfile: false }));
    }
  }, []);

  const signIn = useCallback(
    async (payload: {
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
      profileComplete?: boolean;
    }) => {
      await persist({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user
      });

      if (payload.profileComplete) {
        setState({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          user: payload.user,
          onboarding: null,
          checkingProfile: false,
          restoringSession: false
        });
        return;
      }

      setState({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user,
        onboarding: null,
        checkingProfile: true,
        restoringSession: false
      });

      try {
        const profile = await getProfile(payload.user.id, payload.accessToken);
        const onboarding = detectOnboarding(payload.user, profile);
        setState({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          user: payload.user,
          onboarding,
          checkingProfile: false,
          restoringSession: false
        });
      } catch {
        setState({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          user: payload.user,
          onboarding: null,
          checkingProfile: false,
          restoringSession: false
        });
      }
    },
    [persist]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await loadSession();
      if (cancelled) return;
      if (!session) {
        setState((prev) => ({ ...prev, restoringSession: false }));
        return;
      }
      try {
        // Prefer a fresh access token on cold start.
        const refreshed = await refreshAccessToken(session.refreshToken);
        if (cancelled) return;
        await signIn({
          accessToken: refreshed.tokens.accessToken,
          refreshToken: refreshed.tokens.refreshToken,
          user: refreshed.user
        });
      } catch {
        if (cancelled) return;
        await clearSession();
        setState((prev) => ({ ...prev, restoringSession: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signIn]);

  useEffect(() => {
    setAccessTokenRefreshHandler(async () => {
      const refreshToken = stateRef.current.refreshToken;
      if (!refreshToken) {
        signOut();
        return null;
      }
      try {
        const refreshed = await refreshAccessToken(refreshToken);
        setState((prev) => ({
          ...prev,
          accessToken: refreshed.tokens.accessToken,
          refreshToken: refreshed.tokens.refreshToken,
          user: refreshed.user
        }));
        await persist({
          accessToken: refreshed.tokens.accessToken,
          refreshToken: refreshed.tokens.refreshToken,
          user: refreshed.user
        });
        return refreshed.tokens.accessToken;
      } catch {
        signOut();
        return null;
      }
    });
    return () => setAccessTokenRefreshHandler(null);
  }, [persist, signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.accessToken && state.user),
      signIn,
      completeOnboarding: () => setState((prev) => ({ ...prev, onboarding: null })),
      refreshOnboardingStatus,
      signOut
    }),
    [state, signIn, refreshOnboardingStatus, signOut]
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
