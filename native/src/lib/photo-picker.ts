// Shared profile-photo picking helper: opens the system photo library,
// downscales/compresses to a small square JPEG, and returns it as a
// base64 data URL — the same shape UserProfile.photo_data_url expects
// (mirrors how the web app stores an onboarding/profile photo). Kept small
// (256x256, compressed) since it's stored inline in SQLite as text, not as
// a separate file.
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

const MAX_DIMENSION = 256;
const JPEG_QUALITY = 0.7;

export type PickPhotoResult =
  | { status: "ok"; dataUrl: string }
  | { status: "canceled" }
  | { status: "permission_denied" }
  | { status: "error"; message: string };

export async function pickProfilePhoto(): Promise<PickPhotoResult> {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return { status: "permission_denied" };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { status: "canceled" };
    }

    const asset = result.assets[0];
    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: MAX_DIMENSION, height: MAX_DIMENSION } }],
      { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    if (!manipulated.base64) {
      return { status: "error", message: "No image data returned" };
    }

    return { status: "ok", dataUrl: `data:image/jpeg;base64,${manipulated.base64}` };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : String(err) };
  }
}
