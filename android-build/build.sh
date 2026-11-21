#!/usr/bin/env bash
# Builds a Capacitor Android APK that bundles the whole web app locally (works offline from first launch).
set -euo pipefail
ROOT="$(pwd)"; W="$ROOT/_cap"; rm -rf "$W"; mkdir -p "$W/www"
VER="$(node -p "require('./version.json').version")"
# 1) web assets: everything the app serves, minus dev-only folders
rsync -a --exclude='/.git' --exclude='/.github' --exclude='/_cap' --exclude='/android-build' --exclude='/tests' --exclude='/docs' \
  --exclude='/archive' --exclude='/tools' --exclude='/sources' --exclude='/config' --exclude='node_modules' --exclude='*.md' \
  --exclude='/gallery' --exclude='/scripts' --exclude='/out*' ./ "$W/www/"
cd "$W"
npm init -y >/dev/null
npm i --no-audit --no-fund @capacitor/core@6 @capacitor/cli@6 @capacitor/android@6 >/dev/null
cat > capacitor.config.json <<J
{ "appId": "ly.almustashar.app", "appName": "المستشار الزراعي", "webDir": "www",
  "server": { "androidScheme": "https" }, "android": { "allowMixedContent": false } }
J
npx cap add android >/dev/null
npx cap sync android >/dev/null
# 2) version + camera permission (label scanning) + icons
G=android/app/build.gradle
sed -i "s/versionCode [0-9]*/versionCode ${VERSION_CODE:-2}/; s/versionName \"[^\"]*\"/versionName \"${VER}\"/" "$G"
M=android/app/src/main/AndroidManifest.xml
sed -i 's#<uses-permission android:name="android.permission.INTERNET" />#<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />#' "$M"
grep -q 'permission.CAMERA' "$M" || { echo "camera permission not inserted"; exit 1; }
python3 - <<'P'
import os,shutil
from PIL import Image
res='android/app/src/main/res'
for d in os.listdir(res):
    if d.startswith('mipmap-anydpi'): shutil.rmtree(os.path.join(res,d))
sizes={'mdpi':48,'hdpi':72,'xhdpi':96,'xxhdpi':144,'xxxhdpi':192}
src=Image.open('www/icons/icon-512.png').convert('RGBA')
for k,s in sizes.items():
    p=os.path.join(res,'mipmap-'+k); os.makedirs(p,exist_ok=True)
    for n in ('ic_launcher.png','ic_launcher_round.png','ic_launcher_foreground.png'):
        src.resize((s,s),Image.LANCZOS).save(os.path.join(p,n))
P
# 3) build unsigned release
( cd android && chmod +x gradlew && ./gradlew --no-daemon -q assembleRelease )
UNS="$(ls android/app/build/outputs/apk/release/*.apk | head -1)"
BT="$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)"
# 4) fresh signing key (never stored in the repo); delivered only encrypted with the owner's public key
PW="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)"
keytool -genkeypair -keystore mustashar-release.jks -storepass "$PW" -keypass "$PW" -alias mustashar \
  -keyalg RSA -keysize 4096 -validity 10000 -dname "CN=Abubakr Altashani, C=LY" >/dev/null 2>&1
"$BT/zipalign" -p -f 4 "$UNS" aligned.apk
"$BT/apksigner" sign --ks mustashar-release.jks --ks-pass "pass:$PW" --key-pass "pass:$PW" --ks-key-alias mustashar --out "$ROOT/al-mustashar-${VER}.apk" aligned.apk
"$BT/apksigner" verify --print-certs "$ROOT/al-mustashar-${VER}.apk" | head -4
# encrypt keystore + password (hybrid: random AES key wrapped with RSA public key)
printf 'alias=mustashar\nstorepass=%s\nkeypass=%s\n' "$PW" "$PW" > secrets.txt
tar -cf bundle.tar mustashar-release.jks secrets.txt
openssl rand -hex 32 > k.txt
openssl enc -aes-256-cbc -pbkdf2 -in bundle.tar -out "$ROOT/signing-bundle.enc" -pass file:k.txt
openssl pkeyutl -encrypt -pubin -inkey "$ROOT/android-build/apk-pub.pem" -in k.txt -out "$ROOT/signing-key.enc" -pkeyopt rsa_padding_mode:oaep
rm -f k.txt secrets.txt bundle.tar mustashar-release.jks
ls -la "$ROOT"/*.apk
