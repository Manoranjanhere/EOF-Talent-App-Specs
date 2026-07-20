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
import { MemberSearchScreen } from "../screens/search/member-search-screen";
import { JobSearchScreen } from "../screens/search/job-search-screen";
import { JobPostScreen } from "../screens/jobs/job-post-screen";
import { ChatScreen } from "../screens/chat/chat-screen";
import { HelpFeedbackScreen } from "../screens/feedback/help-feedback-screen";
import { ReportsScreen } from "../screens/admin/reports-screen";
import { UserActionsScreen } from "../screens/admin/user-actions-screen";

const AuthStack = createNativeStackNavigator();
const AppTabs = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();

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

      {/* Employers discover talent — talent does not search other talent */}
      {isEmployer && (
        <AppTabs.Screen
          name="Discover"
          component={MemberSearchScreen}
          options={{ title: "Discover" }}
        />
      )}

      {/* Talent browses jobs — employers post jobs, they don't search job listings */}
      {isTalent && <AppTabs.Screen name="Jobs" component={JobSearchScreen} options={{ title: "Jobs" }} />}

      <AppTabs.Screen name="Chat" component={ChatScreen} />

      {/* Portfolio albums are for talent only */}
      {isTalent && (
        <AppTabs.Screen
          name="Albums"
          component={AlbumsStackNavigator}
          options={{ title: "Albums" }}
        />
      )}

      <AppTabs.Screen name="Profile" component={ProfileStackNavigator} options={{ title: "Profile" }} />
      <AppTabs.Screen name="Help" component={HelpFeedbackScreen} />

      {isEmployer && (
        <AppTabs.Screen name="PostJob" component={JobPostScreen} options={{ title: "Post job" }} />
      )}
      {isAdmin && (
        <AppTabs.Screen name="Reports" component={ReportsScreen} options={{ title: "Reports" }} />
      )}
      {isAdmin && (
        <AppTabs.Screen name="Users" component={UserActionsScreen} options={{ title: "Users" }} />
      )}
    </AppTabs.Navigator>
  );
}

export function RootNavigator() {
  const auth = useAuth();
  const { colors } = useTheme();

  if (auth.isAuthenticated && auth.checkingProfile) {
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
    </AuthStack.Navigator>
  );
}
