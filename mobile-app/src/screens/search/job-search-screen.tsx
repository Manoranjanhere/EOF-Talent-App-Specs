import React, { useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput, View } from "react-native";
import { searchJobs } from "../../services/search.service";

export function JobSearchScreen() {
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [cards, setCards] = useState<any[]>([]);

  const onSearch = async () => {
    try {
      const result = await searchJobs({ city, country });
      setCards((result as any).cards ?? []);
    } catch (error) {
      Alert.alert("Search error", (error as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>Job Board Search</Text>
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
      <Button title="Search Jobs" onPress={onSearch} />
      {cards.map((card) => (
        <View key={card.id} style={{ borderWidth: 1, borderRadius: 12, padding: 14 }}>
          <Text style={{ fontSize: 16, fontWeight: "700" }}>{card.title}</Text>
          <Text>{card.subtitle}</Text>
          <Text>{card.location}</Text>
          <Text>Pay range: {String(card.payRange?.[0] ?? "-")} - {String(card.payRange?.[1] ?? "-")}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
