import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MemberSearchScreen } from "../screens/search/member-search-screen";
import { MemberProfileScreen } from "../screens/search/member-profile-screen";
import { MemberAlbumScreen } from "../screens/search/member-album-screen";
import { PeopleListsScreen } from "../screens/lists/people-lists-screen";
import { PeopleListDetailScreen } from "../screens/lists/people-list-detail-screen";
import type { DiscoverStackParamList } from "./types";

const DiscoverStack = createNativeStackNavigator<DiscoverStackParamList>();

export function DiscoverStackNavigator() {
  return (
    <DiscoverStack.Navigator screenOptions={{ headerShown: false }}>
      <DiscoverStack.Screen name="MemberSearch" component={MemberSearchScreen} />
      <DiscoverStack.Screen name="PeopleLists" component={PeopleListsScreen} />
      <DiscoverStack.Screen name="PeopleListDetail" component={PeopleListDetailScreen} />
      <DiscoverStack.Screen name="MemberProfile" component={MemberProfileScreen} />
      <DiscoverStack.Screen name="MemberAlbum" component={MemberAlbumScreen} />
    </DiscoverStack.Navigator>
  );
}
