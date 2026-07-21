import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { JobPostScreen } from "../screens/jobs/job-post-screen";
import { JobDetailScreen } from "../screens/jobs/job-detail-screen";
import { MemberProfileScreen } from "../screens/search/member-profile-screen";
import { MemberAlbumScreen } from "../screens/search/member-album-screen";
import type { PostJobStackParamList } from "./types";

const PostJobStack = createNativeStackNavigator<PostJobStackParamList>();

export function PostJobStackNavigator() {
  return (
    <PostJobStack.Navigator screenOptions={{ headerShown: false }}>
      <PostJobStack.Screen name="PostJobHome" component={JobPostScreen} />
      <PostJobStack.Screen name="JobDetail" component={JobDetailScreen} />
      <PostJobStack.Screen name="MemberProfile" component={MemberProfileScreen} />
      <PostJobStack.Screen name="MemberAlbum" component={MemberAlbumScreen} />
    </PostJobStack.Navigator>
  );
}
