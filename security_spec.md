# Play Room Security Specification

## 1. Data Invariants
- **GameResult**:
  - `id`: Unique string ID matching the document ID path (`/game_results/{resultId}`).
  - `n`: Player name string (1 to 60 characters).
  - `g`: Game display name string (1 to 50 characters).
  - `gameId`: Game identifier string (1 to 30 characters).
  - `v`: Numerical value representing score or elapsed duration.
  - `t`: Timestamp number representing when the game was completed.
  - `detail`: Optional textual description (max 200 characters).
  - Records are immutable once created; only the verified administrator (`junaidpnofficial@gmail.com`) can delete or correct records.

- **UserProfile**:
  - `userId`: String matching Firebase Auth UID (`request.auth.uid`).
  - `name`: Player display name (1 to 60 characters).
  - Only the owner (`request.auth.uid == userId`) or verified administrator can read/write private profile information.

## 2. Dirty Dozen Payloads & Invariant Protections
1. **Unauthenticated Admin Escalation**: Attempting to delete results without admin identity -> Rejected (`isAdmin()` check fails).
2. **Invalid ID Path Variable**: Attempting to create document with 1KB non-alphanumeric ID -> Rejected (`isValidId()` check fails).
3. **Payload Shadow Fields**: Attempting to inject hidden fields (`isAdmin: true`, `role: 'super'`) into `GameResult` -> Rejected (`keys().hasOnly()` check fails).
4. **Missing Mandatory Fields**: Submitting game result without `gameId` or `v` -> Rejected (`keys().hasAll()` check fails).
5. **Score Modification / Update-Gap**: Regular user attempting to alter an existing game score -> Rejected (`allow update: if isValidId(resultId) && isAdmin()`).
6. **Negative / Non-Number Score Type**: Passing boolean or malicious object for `v` -> Rejected (`data.v is number` check).
7. **Cross-User Profile Spoofing**: User A trying to overwrite User B's profile document -> Rejected (`incoming().userId == request.auth.uid`).
8. **Email Spoofing without Verification**: Attacker registering `junaidpnofficial@gmail.com` on unverified provider -> Rejected (`request.auth.token.email_verified == true`).
9. **Denial-of-Wallet Long Strings**: Submitting 10MB player name -> Rejected (`size() <= 60`).
10. **Orphaned Writes**: Writing to undocumented collection paths -> Blocked by global catch-all `match /{document=**} { allow read, write: if false; }`.
11. **List scraping of private users**: Querying `/users` without admin rights -> Rejected (`allow list: if isAdmin()`).
12. **Tampered Result ID**: Document path `result123` with payload `{ id: "other456" }` -> Rejected (`incoming().id == resultId`).

## 3. Deployed Rules Verification
- Rules deployed to Google Cloud project `gen-lang-client-0706506093` with database `ai-studio-playroomminigame-24fc2eea-c05d-45b6-b97a-10a74d4a2774`.
