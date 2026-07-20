import React from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { CachedMediaImage } from "./cached-media-image";

export function ImageLightbox({
  uri,
  cacheKey,
  visible,
  onClose
}: {
  uri: string | null;
  cacheKey?: string | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!uri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.frame} pointerEvents="box-none">
          <CachedMediaImage
            uri={uri}
            cacheKey={cacheKey}
            style={styles.image}
            contentFit="contain"
          />
          <Text style={styles.hint}>Tap anywhere to close</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16
  },
  frame: {
    width: width - 24,
    height: height * 0.78,
    justifyContent: "center",
    alignItems: "center"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  hint: {
    position: "absolute",
    bottom: -28,
    color: "rgba(255,255,255,0.75)",
    fontSize: 13
  }
});
