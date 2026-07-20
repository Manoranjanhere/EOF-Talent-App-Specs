import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import { CachedMediaImage } from "./cached-media-image";

export type MediaPreview = {
  uri: string;
  cacheKey?: string | null;
  type: "image" | "video";
};

export function MediaLightbox({
  media,
  visible,
  onClose
}: {
  media: MediaPreview | null;
  visible: boolean;
  onClose: () => void;
}) {
  const videoRef = useRef<Video>(null);
  const [buffering, setBuffering] = useState(false);

  useEffect(() => {
    if (!visible) {
      void videoRef.current?.stopAsync().catch(() => undefined);
      void videoRef.current?.unloadAsync().catch(() => undefined);
    }
  }, [visible, media?.uri]);

  if (!media?.uri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.closeHit} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>

        <View style={styles.frame}>
          {media.type === "video" ? (
            <>
              <Video
                ref={videoRef}
                style={styles.video}
                source={{ uri: media.uri }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping={false}
                onLoadStart={() => setBuffering(true)}
                onReadyForDisplay={() => setBuffering(false)}
                onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                  if (!status.isLoaded) {
                    setBuffering(true);
                    return;
                  }
                  setBuffering(status.isBuffering);
                }}
              />
              {buffering ? (
                <View style={styles.buffering}>
                  <ActivityIndicator color="#fff" size="large" />
                </View>
              ) : null}
            </>
          ) : (
            <Pressable style={styles.imageWrap} onPress={onClose}>
              <CachedMediaImage
                uri={media.uri}
                cacheKey={media.cacheKey}
                style={styles.image}
                contentFit="contain"
              />
            </Pressable>
          )}
        </View>

        <Text style={styles.hint}>
          {media.type === "video" ? "Use controls to play · tap Close when done" : "Tap image to close"}
        </Text>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.94)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 40
  },
  closeHit: {
    position: "absolute",
    top: 48,
    right: 16,
    zIndex: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)"
  },
  closeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700"
  },
  frame: {
    width: width - 16,
    height: height * 0.72,
    justifyContent: "center",
    alignItems: "center"
  },
  imageWrap: {
    width: "100%",
    height: "100%"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000"
  },
  buffering: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  hint: {
    marginTop: 16,
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    textAlign: "center"
  }
});
