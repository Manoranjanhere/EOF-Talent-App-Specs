import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { UserActionsScreen } from "../screens/admin/user-actions-screen";
import { MemberProfileScreen } from "../screens/search/member-profile-screen";
import { MemberAlbumScreen } from "../screens/search/member-album-screen";
import type { AdminUsersStackParamList } from "./types";

const UsersStack = createNativeStackNavigator<AdminUsersStackParamList>();

export function AdminUsersStackNavigator() {
  return (
    <UsersStack.Navigator screenOptions={{ headerShown: false }}>
      <UsersStack.Screen name="UsersList" component={UserActionsScreen} />
      <UsersStack.Screen name="MemberProfile" component={MemberProfileScreen} />
      <UsersStack.Screen name="MemberAlbum" component={MemberAlbumScreen} />
    </UsersStack.Navigator>
  );
}
