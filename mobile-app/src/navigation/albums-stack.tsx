import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AlbumDetailScreen, AlbumsScreen } from "../screens/albums/albums-screen";

const Stack = createNativeStackNavigator();

export function AlbumsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AlbumsList" component={AlbumsScreen} />
      <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
    </Stack.Navigator>
  );
}
