#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "--- Starting Ultimate Fix and Build Script ---"

# --- 1. Navigate to the correct directory ---
if [ ! -d "android" ] || [ ! -f "android/build.gradle" ]; then
    echo "Error: Please run this script from the 'Divine-Muse' project root directory."
    exit 1
fi

cd android
echo "✓ Navigated to $(pwd)"

# --- 2. CRITICAL: Check for gradlew ---
if [ ! -f "gradlew" ]; then
    echo "ERROR: 'gradlew' not found in the android directory!"
    echo "Your project may be corrupted. Please ensure you are in the correct directory."
    exit 1
fi

# --- 3. Fix Android Gradle Plugin Version in build.gradle ---
echo "Fixing Android Gradle Plugin version..."
sed -i 's/com.android.tools.build:gradle:.*/com.android.tools.build:gradle:8.7.3/g' build.gradle

# --- 4. Fix Java and add dependencies in app/build.gradle ---
echo "Fixing Java version and dependencies in app/build.gradle..."
APP_GRADLE="app/build.gradle"

# Add compileOptions if not present
if ! grep -q "sourceCompatibility JavaVersion.VERSION_17" "$APP_GRADLE"; then
    sed -i '/compileSdk/a\\n    compileOptions {\n        sourceCompatibility JavaVersion.VERSION_17\n        targetCompatibility JavaVersion.VERSION_17\n    }' "$APP_GRADLE"
fi

# Add a dependencies block at the end of the file to force versions
echo "" >> "$APP_GRADLE"
echo "// Forced compatible dependency versions" >> "$APP_GRADLE"
echo "dependencies {" >> "$APP_GRADLE"
echo '    implementation "androidx.activity:activity:1.8.2"' >> "$APP_GRADLE"
echo '    implementation "androidx.core:core:1.12.0"' >> "$APP_GRADLE"
echo '    implementation "androidx.core:core-ktx:1.12.0"' >> "$APP_GRADLE"
echo "}" >> "$APP_GRADLE"

# --- 5. Create/update gradle.properties to suppress warning ---
echo "Updating gradle.properties..."
echo "android.suppressUnsupportedCompileSdk=36" >> gradle.properties

# --- 6. Clean and Build ---
echo "Cleaning previous build artifacts..."
./gradlew clean

echo "Building the APK... This is the one!"
./gradlew assembleDebug

# --- 7. Final Output ---
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "🎉 BUILD SUCCESSFUL! 🎉"
echo "Your APK is ready at:"
echo "  $(pwd)/$APK_PATH"
echo ""
echo "You can now install this APK using a file manager."
