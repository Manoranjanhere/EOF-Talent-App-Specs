import React, { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  Card,
  EmptyState,
  LabeledInput,
  ListCard,
  PrimaryButton,
  ScreenLayout,
  SectionTitle
} from "../../components/ui";
import { createSkillTag, listAdminTags, type SkillTag } from "../../services/tags.service";
import { useAuth } from "../../state/auth-context";

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
      <Card>
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
      </Card>

      <SectionTitle title={loading ? "Loading…" : `All skills (${tags.length})`} />
      {tags.length === 0 && !loading ? (
        <EmptyState message="No skills yet. Add the first skill tag above." />
      ) : (
        tags.map((tag) => {
          const meta: string[] = [tag.slug];
          if (tag.published === false) meta.push("Unpublished");
          if (tag.isActive === false) meta.push("Inactive");
          return (
            <ListCard
              key={tag.id}
              title={tag.title}
              subtitle={tag.slug}
              meta={meta}
              badge={tag.published === false ? "OFF" : tag.isActive === false ? "INACTIVE" : "LIVE"}
            />
          );
        })
      )}
    </ScreenLayout>
  );
}
