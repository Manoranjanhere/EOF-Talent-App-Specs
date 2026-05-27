import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { GroupId } from "@eof/shared";
import { colors } from "../components/ui";
import { useAuth } from "../state/auth-context";
import { LoginScreen } from "../screens/auth/login-screen";
import { RegisterScreen } from "../screens/auth/register-screen";
import { DashboardScreen } from "../screens/home/dashboard-screen";
import { TalentProfileScreen } from "../screens/profile/talent-profile-screen";
import { OrgProfileScreen } from "../screens/profile/org-profile-screen";
import { AlbumsScreen } from "../screens/albums/albums-screen";
import { MemberSearchScreen } from "../screens/search/member-search-screen";
import { JobSearchScreen } from "../screens/search/job-search-screen";
import { JobPostScreen } from "../screens/jobs/job-post-screen";
import { ChatScreen } from "../screens/chat/chat-screen";
import { HelpFeedbackScreen } from "../screens/feedback/help-feedback-screen";
import { ReportsScreen } from "../screens/admin/reports-screen";
import { UserActionsScreen } from "../screens/admin/user-actions-screen";

const AuthStack = createNativeStackNavigator();
const AppTabs = createBottomTabNavigator();

const tabScreenOptions = {
  headerShown: false,
  tabBarStyle: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    height: 62,
    paddingBottom: 8,
    paddingTop: 6
  },
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.muted,
  tabBarLabelStyle: { fontSize: 11, fontWeight: "600" as const }
};

function TabsNavigator() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isEmployer = roles.includes(GroupId.TalentEmployerOrAgency);
  const isAdmin =
    roles.includes(GroupId.Admin) ||
    roles.includes(GroupId.TeamAdmin) ||
    roles.includes(GroupId.SuperAdmin);

  return (
    <AppTabs.Navigator screenOptions={tabScreenOptions}>
      <AppTabs.Screen name="Home" component={DashboardScreen} options={{ title: "Home" }} />
      <AppTabs.Screen name="Discover" component={MemberSearchScreen} options={{ title: "Discover" }} />
      <AppTabs.Screen name="Jobs" component={JobSearchScreen} />
      <AppTabs.Screen name="Chat" component={ChatScreen} />
      <AppTabs.Screen name="Albums" component={AlbumsScreen} />
      <AppTabs.Screen name="Profile" component={TalentProfileScreen} />
      <AppTabs.Screen name="Help" component={HelpFeedbackScreen} />
      {isEmployer && (
        <AppTabs.Screen name="Company" component={OrgProfileScreen} options={{ title: "Company" }} />
      )}
      {isEmployer && (
        <AppTabs.Screen name="PostJob" component={JobPostScreen} options={{ title: "Post" }} />
      )}
      {isAdmin && (
        <AppTabs.Screen name="Reports" component={ReportsScreen} />
      )}
      {isAdmin && (
        <AppTabs.Screen name="Actions" component={UserActionsScreen} options={{ title: "Actions" }} />
      )}
    </AppTabs.Navigator>
  );
}

export function RootNavigator() {
  const auth = useAuth();
  if (auth.isAuthenticated) {
    return <TabsNavigator />;
  }

  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}
