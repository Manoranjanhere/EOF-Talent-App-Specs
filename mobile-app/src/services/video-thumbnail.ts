import * as VideoThumbnails from "expo-video-thumbnails";

export async function generateVideoThumbnail(videoUri: string): Promise<string | null> {
  try {
    const result = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: 800,
      quality: 0.6
    });
    return result.uri;
  } catch {
    return null;
  }
}
