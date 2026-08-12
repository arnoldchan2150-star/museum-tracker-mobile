# Wanderstamp Native Store Release

## Current configuration

The app is configured as **Wanderstamp**, version **1.1.0**, portrait orientation, with the existing app icon and bundle ID `com.app.museumtrackermobile`. `eas.json` contains `preview` and `production` build profiles. The production Android profile produces an Android App Bundle, while the iOS profile is ready for a signed App Store build.

## Important distinction

Expo Go is a development client. It is not the distribution channel for the final product. A user can download the production build directly from the App Store or Google Play after the developer account, signing, store listing, submission, and review steps are completed.

## Release sequence

1. Create or connect an Expo Application Services project for Wanderstamp and confirm the final iOS bundle identifier and Android package name.
2. Add Apple Developer and Google Play Console credentials in the release environment. These credentials must be handled securely by the project owner and should not be committed to the repository.
3. Create a production build using the `production` profile. The iOS output is submitted to App Store Connect for TestFlight and review. The Android App Bundle is uploaded to Google Play Console for internal testing and production release.
4. Prepare the store listing: app name, subtitle, description, screenshots, privacy policy URL, age rating, support URL, and contact details.
5. Test the signed builds on physical devices. In particular, verify world-map pinch zoom and pan, marker callouts, photo-library permission, multi-photo Album saving, Profile persistence after restart, and the add-museum flow.
6. Submit the iOS and Android listings for review. After approval, users download Wanderstamp directly from the relevant store without Expo Go.

## Current product caveats

Museum records, Profile fields, and photo URIs are currently stored locally with AsyncStorage. A photo URI may not be portable across devices, so cloud photo storage and account-based sync should be added before promising cross-device backup. Map markers use saved coordinates when present and known coordinates for the included seed museums.

## Publishing responsibility

The project is prepared for native building, but actual publishing cannot be completed from the development preview alone. The owner must provide developer-account access, complete signing, finish store metadata, submit the builds, and respond to store review requirements.
