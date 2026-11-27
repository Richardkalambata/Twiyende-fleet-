# Twende for Android

The rider app starts at the same Twende welcome page as the website. It uses the website's sign-in, rider dashboard, and fare screens. On a WebView with native messaging support, the fare screen can open the Android QR scanner. The web scanner and manual bus entry cover other browsers.

Build with Android SDK 36, Build Tools 36.0.0, and a supported JDK.

```sh
./gradlew :app:testDebugUnitTest :app:lintRelease :app:bundleRelease
```

The release bundle uses `com.modernmindsettechnologies.twende` with version 0.1.1 and version code 2. Sign it with the upload key registered to the existing Twende Play Console app before uploading. Deploy the web changes to Twende's existing service to enable the native scanner button and the rider performance improvements.
