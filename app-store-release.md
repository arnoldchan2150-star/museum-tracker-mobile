# Wanderstamp Native Store Release

## Current configuration

Wanderstamp is configured as version **1.3.0** with portrait orientation, the existing app icon, and Bundle ID `com.app.museumtrackermobile`. `eas.json` contains preview and production profiles. The production iOS profile is prepared for a signed App Store build.

The iOS config enables `usesAppleSignIn: true` and includes the `expo-apple-authentication` plugin. The app also keeps the existing Manus OAuth flow for Web and Android. The native iOS Apple button is shown only when Apple Authentication is available.

## Sign in with Apple requirements

Before creating the final iOS build, enable **Sign in with Apple** for the registered Bundle ID `com.app.museumtrackermobile` in Apple Developer. The server endpoint `POST /api/oauth/apple` verifies the Apple identity token signature, issuer, audience, expiration, nonce, and subject before creating the same account-scoped session used by the rest of Wanderstamp.

Apple ID requires a new native build after the iOS capability is changed. Expo Go is not a reliable final test for this flow because it may use Expo Go's own app identifier rather than Wanderstamp's production Bundle ID. Test Apple login with an EAS development build or TestFlight build on a real iPhone.

## Release sequence

First, confirm the Bundle ID and enable Sign in with Apple in Apple Developer. Next, create an iOS production build with the production EAS profile and upload it to App Store Connect. Use TestFlight to verify Apple ID sign-in, account creation, logout, account switching, world-map markers, photo and video albums, descriptions, cloud restore, and auto-sync on a real device. Finally, complete App Store metadata, privacy information, screenshots, age rating, support URL, and review notes before submitting for App Review.

## Authentication test matrix

| Environment | Expected sign-in method | Apple ID expectation |
|---|---|---|
| Web preview | Manus OAuth browser flow | Native Apple button is hidden; browser flow must provide the configured provider options |
| Expo Go | Manus OAuth browser flow | Do not treat this as final Apple credential validation |
| EAS development iOS build | Native Apple button plus Manus fallback | Test on a real iPhone with the production Bundle ID capability |
| TestFlight / App Store | Native Apple button plus Manus fallback | Required release validation before App Review |

## Publishing responsibility

Expo Go is a development client, not the distribution channel for the final product. The project is prepared for native building, but the owner must complete Apple Developer enrollment, capability configuration, signing, App Store metadata, TestFlight testing, submission, and review responses. Developer credentials must be entered through the official Apple and EAS interfaces and should not be committed to the repository.

## Official references

Apple identity-token verification: https://developer.apple.com/documentation/signinwithapple/verifying-a-user

Expo Apple Authentication: https://docs.expo.dev/versions/latest/sdk/apple-authentication/

Apple Developer Program: https://developer.apple.com/programs/enroll/

App Store Connect: https://developer.apple.com/app-store-connect/
