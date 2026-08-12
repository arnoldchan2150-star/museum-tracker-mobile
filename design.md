# Wanderstamp Mobile Interface Design

## Product direction

Wanderstamp is a portrait-first iOS-style museum travel passport. The first screen is a calm world map that makes the user’s cultural journey immediately visible. The design uses deep ocean blue `#0A5E75`, paper cream `#F7F4EE`, stamp gold `#D9B86C`, ink `#17242B`, and muted teal `#B7E4E8`.

## Screen list

| Screen | Primary content and functionality |
|---|---|
| World Footprints | Zoomable and pannable world map, updated museum markers, museum names, country/city summary, and link to the full library. |
| Museum Library | Searchable museum list with country and year filters. |
| Museum Detail | Museum metadata, visit note, rating, photo Album grid, multi-select photo import, and delete photo action. |
| Add Museum | Form for museum name, city, country, visit date, rating, and notes. |
| My Profile | Collector identity, museum count, editable name, title, biography, and optional avatar URL. |
| Native Store Release | Production app configuration with portrait orientation, app icon, version 1.1.0, iOS/Android bundle IDs, and EAS build profiles. |

## Key user flows

1. The user opens Wanderstamp and immediately sees the world map. They pinch or use the zoom controls, then tap an updated museum marker to open its detail screen.
2. The user opens a museum detail screen, taps “新增照片”, allows photo access, selects one or more images, and sees them appear in a two-column Album. Each image can be removed later.
3. The user opens “我的”, taps “編輯”, enters a name, collector identity, biography, and optional avatar URL, then saves. The profile remains available after restart because it is stored locally.
4. The user records a new museum from the add action. The new museum becomes part of the local library and is mapped using saved or known museum coordinates.
5. The user tests using Expo Go during development, then uses the production native build profile for App Store / Google Play distribution. Store publication requires developer credentials, signing, submission, and review outside the development preview.

## Interaction and accessibility

The map supports pinch zoom and pan on native iOS/Android builds, plus visible plus/minus controls. Markers expose museum name and city. Primary actions use press opacity feedback and light haptics. Album images have descriptive labels and the empty state explains how to add the first memory. All form fields have visible labels and keyboard-aware layout.

## Data assumptions

Museum records, photos, and profile fields are currently saved locally with AsyncStorage. Photo URIs are device-local and are not yet cloud-backed. Cross-device sync, account login, and shared photo storage are intentionally deferred until the local product flow is validated.
