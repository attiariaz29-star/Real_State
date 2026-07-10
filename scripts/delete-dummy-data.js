/**
 * delete-dummy-data.js
 * ---------------------------------------------------------------
 * ONE-TIME script — permanently deletes the old auto-generated
 * dummy/demo properties directly from your live Firebase Realtime
 * Database, using admin credentials (bypasses all security rules,
 * so no login/button-click in the browser needed).
 *
 * It ONLY deletes properties that do NOT have a `userId` field.
 * Real listings added by sellers through "Add Property" always have
 * a `userId`, so they are automatically kept safe.
 *
 * ---------------------------------------------------------------
 * HOW TO RUN (one time):
 *
 *   1. Get a service account key:
 *      Firebase Console -> Project Settings (gear icon) -> Service
 *      Accounts tab -> "Generate new private key". This downloads a
 *      JSON file — save it as serviceAccountKey.json in this same
 *      "scripts" folder. (Keep it private — never commit it to a
 *      public repo, never upload it anywhere public.)
 *
 *   2. Open a terminal in this "scripts" folder and run:
 *        npm install firebase-admin
 *
 *   3. Run the script:
 *        node delete-dummy-data.js
 *
 *   It will print exactly how many dummy properties were deleted
 *   and how many real listings were kept.
 * ---------------------------------------------------------------
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error(
    "\n❌ serviceAccountKey.json not found in the scripts folder.\n" +
    "   Download it from Firebase Console -> Project Settings -> Service Accounts\n" +
    "   -> Generate new private key, save it here as serviceAccountKey.json, then re-run.\n"
  );
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nestfinder-ai-default-rtdb.firebaseio.com",
});

async function main() {
  const db = admin.database();
  const ref = db.ref("properties");

  const snap = await ref.once("value");
  const data = snap.val();

  if (!data) {
    console.log("No properties found in the database. Nothing to do.");
    process.exit(0);
  }

  const updates = {};
  let removed = 0;
  let kept = 0;

  Object.keys(data).forEach((key) => {
    if (!data[key].userId) {
      updates[key] = null; // marks this key for permanent deletion
      removed++;
    } else {
      kept++;
    }
  });

  if (removed === 0) {
    console.log(`✅ No dummy data found. ${kept} real listing(s) already in place.`);
    process.exit(0);
  }

  await ref.update(updates);

  console.log(`\n✅ Done. Permanently deleted ${removed} dummy propert${removed === 1 ? "y" : "ies"}.`);
  console.log(`   Kept ${kept} real seller-added listing(s) untouched.\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
