import React, { useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { searchMembers } from "../../services/search.service";

export function MemberSearchScreen() {
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [groupId, setGroupId] = useState("");
  const [cards, setCards] = useState<any[]>([]);

  const onSearch = async () => {
    try {
      const result = await searchMembers({
        city,
        country,
        groupId: groupId ? Number(groupId) : undefined
      });
      setCards((result as any).cards ?? []);
    } catch (error) {
      Alert.alert("Search error", (error as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>Member Search</Text>
      <TextInput
        value={city}
        onChangeText={setCity}
        placeholder="City"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <TextInput
        value={country}
        onChangeText={setCountry}
        placeholder="Country"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <TextInput
        value={groupId}
        onChangeText={setGroupId}
        placeholder="User type / Group ID"
        keyboardType="numeric"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <Button title="Search" onPress={onSearch} />

      {cards.map((card) => (
        <View
          key={card.id}
          style={{
            padding: 14,
            borderWidth: 1,
            borderRadius: 14,
            backgroundColor: "#fafafa"
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700" }}>{card.title}</Text>
          <Text>{card.subtitle}</Text>
          <Text>Rating: {String(card.rating)}</Text>
          <Text>Tags: {(card.tags ?? []).join(", ")}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
