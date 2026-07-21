import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ReportsScreen } from "../screens/admin/reports-screen";
import { MemberProfileScreen } from "../screens/search/member-profile-screen";
import { MemberAlbumScreen } from "../screens/search/member-album-screen";
import type { AdminReportsStackParamList } from "./types";

const ReportsStack = createNativeStackNavigator<AdminReportsStackParamList>();

export function AdminReportsStackNavigator() {
  return (
    <ReportsStack.Navigator screenOptions={{ headerShown: false }}>
      <ReportsStack.Screen name="ReportsList" component={ReportsScreen} />
      <ReportsStack.Screen name="MemberProfile" component={MemberProfileScreen} />
      <ReportsStack.Screen name="MemberAlbum" component={MemberAlbumScreen} />
    </ReportsStack.Navigator>
  );
}
