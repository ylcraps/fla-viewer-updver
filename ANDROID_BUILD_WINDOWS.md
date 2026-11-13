# FLA Viewer — Android build on Windows

The viewer already has play/pause, stop, previous/next frame, and a seekable timeline. On narrow screens the mobile transport menu groups these controls with an **Open FLA/XFL** action. It reuses the same player and timeline as the main viewer.

## Build the Android debug APK from Windows CMD

Install Node.js 20+, JDK 17+, and Android SDK Command-line Tools. Set `ANDROID_HOME` to your SDK folder and accept SDK licenses. Then run from the project root:

```bat
build-android.bat
```

The script installs npm and Android SDK dependencies, builds the Vite app using relative asset paths, creates/syncs the Capacitor Android wrapper, and builds the debug APK.

Output:

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

See `ANDROID_BUILD_WINDOWS.md` for detailed setup and manual commands. APK export codecs depend on Android WebView/device support; test MP4/WebM on the target phone.
