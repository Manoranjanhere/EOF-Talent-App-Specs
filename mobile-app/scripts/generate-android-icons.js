/**
 * Regenerates Android launcher icons + splash from mobile-app/assets.
 * Run: node scripts/generate-android-icons.js
 */
const fs = require("fs");
const path = require("path");
const { generateImageAsync } = require("@expo/image-utils");

const root = path.join(__dirname, "..");
const resDir = path.join(root, "android", "app", "src", "main", "res");
const iconSrc = path.join(root, "assets", "icon.png");
const adaptiveSrc = path.join(root, "assets", "adaptive-icon.png");
const splashSrc = path.join(root, "assets", "splash-icon.png");

const mipmaps = [
  { dir: "mipmap-mdpi", size: 48 },
  { dir: "mipmap-hdpi", size: 72 },
  { dir: "mipmap-xhdpi", size: 96 },
  { dir: "mipmap-xxhdpi", size: 144 },
  { dir: "mipmap-xxxhdpi", size: 192 }
];

// Adaptive foregrounds (safe zone ~66% for letter)
const adaptiveSizes = [
  { dir: "mipmap-mdpi", size: 108 },
  { dir: "mipmap-hdpi", size: 162 },
  { dir: "mipmap-xhdpi", size: 216 },
  { dir: "mipmap-xxhdpi", size: 324 },
  { dir: "mipmap-xxxhdpi", size: 432 }
];

async function resizePng(src, size, outPath) {
  const { source: buffer } = await generateImageAsync(
    { projectRoot: root, cacheType: "android-icon" },
    {
      src,
      width: size,
      height: size,
      resizeMode: "cover",
      backgroundColor: "#1D4ED8"
    }
  );
  fs.writeFileSync(outPath, buffer);
  console.log("wrote", path.relative(root, outPath), `(${size}x${size})`);
}

async function main() {
  if (!fs.existsSync(iconSrc)) {
    throw new Error(`Missing ${iconSrc}`);
  }

  for (const { dir, size } of mipmaps) {
    const folder = path.join(resDir, dir);
    fs.mkdirSync(folder, { recursive: true });
    await resizePng(iconSrc, size, path.join(folder, "ic_launcher.png"));
    await resizePng(iconSrc, size, path.join(folder, "ic_launcher_round.png"));
  }

  // Adaptive icon foreground layers
  for (const { dir, size } of adaptiveSizes) {
    const folder = path.join(resDir, dir);
    fs.mkdirSync(folder, { recursive: true });
    await resizePng(
      adaptiveSrc || iconSrc,
      size,
      path.join(folder, "ic_launcher_foreground.png")
    );
  }

  // Adaptive icon XML (API 26+)
  const anydpi = path.join(resDir, "mipmap-anydpi-v26");
  fs.mkdirSync(anydpi, { recursive: true });
  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/iconBackground"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
  fs.writeFileSync(path.join(anydpi, "ic_launcher.xml"), adaptiveXml);
  fs.writeFileSync(path.join(anydpi, "ic_launcher_round.xml"), adaptiveXml);
  console.log("wrote mipmap-anydpi-v26 adaptive icons");

  // Color resources
  const valuesDir = path.join(resDir, "values");
  fs.mkdirSync(valuesDir, { recursive: true });
  const colorsPath = path.join(valuesDir, "colors.xml");
  fs.writeFileSync(
    colorsPath,
    `<resources>
  <color name="splashscreen_background">#1D4ED8</color>
  <color name="iconBackground">#1D4ED8</color>
  <color name="colorPrimary">#1D4ED8</color>
  <color name="colorPrimaryDark">#1D4ED8</color>
</resources>
`
  );
  console.log("updated colors.xml");

  // Splash drawable with centered logo
  const drawableDir = path.join(resDir, "drawable");
  fs.mkdirSync(drawableDir, { recursive: true });
  await resizePng(splashSrc || iconSrc, 288, path.join(drawableDir, "splashscreen_logo.png"));
  fs.writeFileSync(
    path.join(drawableDir, "splashscreen.xml"),
    `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background"/>
  <item>
    <bitmap
      android:gravity="center"
      android:src="@drawable/splashscreen_logo"/>
  </item>
</layer-list>
`
  );
  console.log("updated splashscreen");
  console.log("Done. Rebuild the APK to see the new icon.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
