import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AlbumDetailScreen, AlbumsScreen } from "../screens/albums/albums-screen";
import type { AlbumsStackParamList } from "./types";

const Stack = createNativeStackNavigator<AlbumsStackParamList>();

export function AlbumsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AlbumsList" component={AlbumsScreen} />
      <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
    </Stack.Navigator>
  );
}
