import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { GroupId } from "@eof/shared";
import { getProfile } from "../services/profile.service";

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
    checkingProfile: false
  });

  const refreshOnboardingStatus = useCallback(async () => {
    if (!state.accessToken || !state.user) return;
    try {
      setState((prev) => ({ ...prev, checkingProfile: true }));
      const profile = await getProfile(state.user.id, state.accessToken);
      const onboarding = detectOnboarding(state.user, profile);
      setState((prev) => ({ ...prev, onboarding, checkingProfile: false }));
    } catch {
      setState((prev) => ({ ...prev, checkingProfile: false }));
    }
  }, [state.accessToken, state.user]);

  const signIn = useCallback(
    async (payload: {
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
      profileComplete?: boolean;
    }) => {
      if (payload.profileComplete) {
        setState({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          user: payload.user,
          onboarding: null,
          checkingProfile: false
        });
        return;
      }

      setState({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user,
        onboarding: null,
        checkingProfile: true
      });

      try {
        const profile = await getProfile(payload.user.id, payload.accessToken);
        const onboarding = detectOnboarding(payload.user, profile);
        setState({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          user: payload.user,
          onboarding,
          checkingProfile: false
        });
      } catch {
        setState({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          user: payload.user,
          onboarding: null,
          checkingProfile: false
        });
      }
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.accessToken && state.user),
      signIn,
      completeOnboarding: () => setState((prev) => ({ ...prev, onboarding: null })),
      refreshOnboardingStatus,
      signOut: () =>
        setState({
          accessToken: null,
          refreshToken: null,
          user: null,
          onboarding: null,
          checkingProfile: false
        })
    }),
    [state, signIn, refreshOnboardingStatus]
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
