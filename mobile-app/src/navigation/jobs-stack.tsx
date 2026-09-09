import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { JobSearchScreen } from "../screens/search/job-search-screen";
import { ReferJobScreen } from "../screens/jobs/refer-job-screen";
import { MemberProfileScreen } from "../screens/search/member-profile-screen";
import { MemberAlbumScreen } from "../screens/search/member-album-screen";
import type { JobsStackParamList } from "./types";

const JobsStack = createNativeStackNavigator<JobsStackParamList>();

export function JobsStackNavigator() {
  return (
    <JobsStack.Navigator screenOptions={{ headerShown: false }}>
      <JobsStack.Screen name="JobBoard" component={JobSearchScreen} />
      <JobsStack.Screen name="ReferJob" component={ReferJobScreen} />
      <JobsStack.Screen name="MemberProfile" component={MemberProfileScreen} />
      <JobsStack.Screen name="MemberAlbum" component={MemberAlbumScreen} />
    </JobsStack.Navigator>
  );
}
