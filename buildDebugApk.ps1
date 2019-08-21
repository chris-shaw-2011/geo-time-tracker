$path = "android/app/src/main/assets"

md -Force $path

react-native bundle --platform android --dev false --entry-file index.js --bundle-output $path/index.android.bundle --assets-dest android/app/src/main/res/

cd android

./gradlew assembleDebug

cd ..