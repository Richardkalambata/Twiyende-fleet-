# Twende and Twende Fleet for Android

Build the rider and fleet flavors from this shared project. Twende
(`com.modernmindsettechnologies.twende`) opens the rider welcome on a fresh
install. Twende Fleet (`com.modernmindsettechnologies.twende.fleet`) opens the
Fleet welcome with operator and conductor sign-in and operator registration.
The app remembers the last signed-in role and can open its dashboard directly
when a session cookie is present. The server checks the session every time.

Build with Android SDK 36, Build Tools 36.0.0, and a supported JDK.

```sh
./gradlew :app:testRiderReleaseUnitTest :app:testFleetReleaseUnitTest \
  :app:lintRiderRelease :app:lintFleetRelease :app:bundleRiderRelease :app:bundleFleetRelease
```

The rider update is 0.1.2, version code 3. Sign it with the upload key
registered to the existing Twende Play listing. Fleet starts at 0.1.0,
version code 1, with a separate signing key and listing.

Deploy the matching web version before testing either Android build on a
phone. Run the database preparation script with the migration role before
enabling PIN recovery. It needs the dedicated `TWILIO_PIN_RESET_SERVICE_SID`
and Twilio API credentials to send six-digit codes.
