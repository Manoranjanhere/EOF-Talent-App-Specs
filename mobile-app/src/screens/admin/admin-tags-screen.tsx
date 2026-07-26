import React, { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  Card,
  EmptyState,
  LabeledInput,
  PrimaryButton,
  ScreenLayout,
  SectionTitle
} from "../../components/ui";
import { createSkillTag, listAdminTags, type SkillTag } from "../../services/tags.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";

function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Admin: add primary/secondary skill tags used on talent profiles & job posts. */
export function AdminTagsScreen() {
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const [tags, setTags] = useState<SkillTag[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const list = await listAdminTags(accessToken);
      setTags(Array.isArray(list) ? list : []);
    } catch (error) {
      Alert.alert("Could not load skills", (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onAdd = async () => {
    if (!accessToken) return;
    const nextTitle = title.trim();
    const nextSlug = (slug.trim() || slugify(nextTitle)).toLowerCase();
    if (nextTitle.length < 2) {
      Alert.alert("Missing title", "Enter a skill name (e.g. Acting, Modeling).");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(nextSlug)) {
      Alert.alert("Invalid slug", "Slug must be lowercase letters, numbers, and hyphens.");
      return;
    }
    try {
      setSaving(true);
      await createSkillTag(accessToken, { title: nextTitle, slug: nextSlug });
      setTitle("");
      setSlug("");
      Alert.alert("Skill added", `"${nextTitle}" is now available as a primary/secondary skill.`);
      await load();
    } catch (error) {
      Alert.alert("Could not add skill", (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenLayout
      title="Skill tags"
      subtitle="Add primary & secondary skills for talent profiles and job posts"
    >
      <SectionTitle title="Add skill" />
      <LabeledInput
        label="Skill title"
        value={title}
        onChangeText={(value) => {
          setTitle(value);
          if (!slug.trim()) setSlug(slugify(value));
        }}
        placeholder="e.g. Voice Over"
      />
      <LabeledInput
        label="Slug"
        value={slug}
        onChangeText={setSlug}
        placeholder="voice-over"
        autoCapitalize="none"
      />
      <PrimaryButton
        title={saving ? "Adding..." : "Add skill tag"}
        onPress={onAdd}
        disabled={saving}
        loading={saving}
      />

      <SectionTitle title={loading ? "Loading…" : `All skills (${tags.length})`} />
      {tags.length === 0 && !loading ? (
        <EmptyState message="No skills yet. Add the first skill tag above." />
      ) : (
        tags.map((tag) => (
          <Card key={tag.id}>
            <View style={{ gap: 4 }}>
              <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>{tag.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {tag.slug}
                {tag.published === false ? " · unpublished" : ""}
                {tag.isActive === false ? " · inactive" : ""}
              </Text>
            </View>
          </Card>
        ))
      )}
    </ScreenLayout>
  );
}
