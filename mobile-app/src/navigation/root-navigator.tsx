import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { GroupId } from "@eof/shared";
import { ScrollableTabBar } from "./scrollable-tab-bar";
import { useTheme } from "../theme/theme-context";
import { useAuth } from "../state/auth-context";
import { LoginScreen } from "../screens/auth/login-screen";
import { RegisterScreen } from "../screens/auth/register-screen";
import { ForgotPasswordScreen } from "../screens/auth/forgot-password-screen";
import { CompleteOnboardingScreen } from "../screens/auth/complete-onboarding-screen";
import { DashboardScreen } from "../screens/home/dashboard-screen";
import { ActivityIndicator, View } from "react-native";
import { ProfileHubScreen } from "../screens/profile/profile-hub-screen";
import { TalentProfileScreen } from "../screens/profile/talent-profile-screen";
import { OrgProfileScreen } from "../screens/profile/org-profile-screen";
import { AlbumDetailScreen, AlbumsScreen } from "../screens/albums/albums-screen";
import { AlbumsStackNavigator } from "./albums-stack";
import { DiscoverStackNavigator } from "./discover-stack";
import { AdminReportsStackNavigator } from "./admin-reports-stack";
import { AdminUsersStackNavigator } from "./admin-users-stack";
import { AdminTagsScreen } from "../screens/admin/admin-tags-screen";
import { JobSearchScreen } from "../screens/search/job-search-screen";
import { PostJobStackNavigator } from "./post-job-stack";
import { ChatStackNavigator } from "./chat-stack";
import { HelpFeedbackScreen } from "../screens/feedback/help-feedback-screen";
import { PrivacyPolicyScreen } from "../screens/legal/privacy-policy-screen";
import { TermsOfServiceScreen } from "../screens/legal/terms-of-service-screen";
import type { ProfileStackParamList } from "./types";

const AuthStack = createNativeStackNavigator();
const AppTabs = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHub" component={ProfileHubScreen} />
      <ProfileStack.Screen name="EditTalentProfile" component={TalentProfileScreen} />
      <ProfileStack.Screen name="EditOrgProfile" component={OrgProfileScreen} />
      <ProfileStack.Screen name="AlbumsManage" component={AlbumsScreen} />
      <ProfileStack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
    </ProfileStack.Navigator>
  );
}

function TabsNavigator() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isTalent = roles.includes(GroupId.Talent);
  const isEmployer = roles.includes(GroupId.TalentEmployerOrAgency);
  const isAdmin =
    roles.includes(GroupId.Admin) ||
    roles.includes(GroupId.TeamAdmin) ||
    roles.includes(GroupId.SuperAdmin);

  return (
    <AppTabs.Navigator
      tabBar={(props) => <ScrollableTabBar {...props} />}
      screenOptions={{
        headerShown: false
      }}
    >
      <AppTabs.Screen name="Home" component={DashboardScreen} options={{ title: "Home" }} />

      {isEmployer && (
        <AppTabs.Screen
          name="Discover"
          component={DiscoverStackNavigator}
          options={{ title: "Discover" }}
        />
      )}

      {isTalent && <AppTabs.Screen name="Jobs" component={JobSearchScreen} options={{ title: "Jobs" }} />}

      <AppTabs.Screen name="Chat" component={ChatStackNavigator} options={{ title: "Chat" }} />

      {isTalent && (
        <AppTabs.Screen
          name="Albums"
          component={AlbumsStackNavigator}
          options={{ title: "Albums" }}
        />
      )}

      <AppTabs.Screen name="Profile" component={ProfileStackNavigator} options={{ title: "Profile" }} />

      {isEmployer && (
        <AppTabs.Screen name="PostJob" component={PostJobStackNavigator} options={{ title: "Post job" }} />
      )}

      <AppTabs.Screen name="Help" component={HelpFeedbackScreen} options={{ title: "Help" }} />

      {isAdmin && (
        <AppTabs.Screen
          name="Reports"
          component={AdminReportsStackNavigator}
          options={{ title: "Reports" }}
        />
      )}
      {isAdmin && (
        <AppTabs.Screen
          name="Users"
          component={AdminUsersStackNavigator}
          options={{ title: "Users" }}
        />
      )}
      {isAdmin && (
        <AppTabs.Screen name="Skills" component={AdminTagsScreen} options={{ title: "Skills" }} />
      )}
    </AppTabs.Navigator>
  );
}

export function RootNavigator() {
  const auth = useAuth();
  const { colors } = useTheme();

  if (auth.restoringSession || (auth.isAuthenticated && auth.checkingProfile)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (auth.isAuthenticated && auth.onboarding) {
    return <CompleteOnboardingScreen />;
  }

  if (auth.isAuthenticated) {
    return <TabsNavigator />;
  }

  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <AuthStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
    </AuthStack.Navigator>
  );
}
