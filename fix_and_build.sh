#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "--- Starting Automated Fix and Build Script ---"

# --- 1. Navigate to the correct directory ---
# Check if we're in the Divine-Muse directory
if [ ! -d "android" ] || [ ! -f "android/build.gradle" ]; then
    echo "Error: Please run this script from the 'Divine-Muse' project root directory."
    exit 1
fi

cd android

echo "✓ Navigated to $(pwd)"

# --- 2. Fix Java Version in app/build.gradle ---
APP_BUILD_GRADLE="app/build.gradle"
echo "Fixing Java version in $APP_BUILD_GRADLE..."

# Check if compileOptions block already exists to avoid adding it twice
if ! grep -q "compileOptions {" "$APP_BUILD_GRADLE"; then
    # Use sed to insert the compileOptions block after the compileSdk line
    sed -i '/compileSdk/a\\n    compileOptions {\n        sourceCompatibility JavaVersion.VERSION_17\n        targetCompatibility JavaVersion.VERSION_17\n    }' "$APP_BUILD_GRADLE"
    echo "  -> Added Java 17 compatibility options."
else
    echo "  -> Java compatibility options already exist. Skipping."
fi

# --- 3. Fix Android Gradle Plugin Version in build.gradle ---
PROJECT_BUILD_GRADLE="build.gradle"
echo "Fixing Android Gradle Plugin version in $PROJECT_BUILD_GRADLE..."

# Replace version 8.13.0 with 8.1.4
sed -i 's/com.android.tools.build:gradle:8.13.0/com.android.tools.build:gradle:8.1.4/g' "$PROJECT_BUILD_GRADLE"
echo "  -> Downgraded AGP to version 8.1.4."

# --- 4. Clean and Build ---
echo "Cleaning previous build artifacts..."
./gradlew clean

echo "Building the APK... (This may take a few minutes)"
./gradlew assembleDebug

# --- 5. Final Output ---
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "🎉 BUILD SUCCESSFUL! 🎉"
echo "Your APK is ready at:"
echo "  $(pwd)/$APK_PATH"
echo ""
echo "You can now install this APK using a file manager."
