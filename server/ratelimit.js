// Shared per-IP daily rate-limit helper for C:\Users\thatc\functions.
// Pattern copied from canopy-mycelial/functions/agents/casey.js.
// Fail-OPEN: a Firestore error lets the request through rather than
// taking the app down.

const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();

/**
 * Returns true (allowed) or false (limit exceeded).
 * @param {number} maxPerDay
 * @param {string} ip
 */
async function checkRateLimit(maxPerDay, ip) {
  try {
    const db     = admin.firestore();
    const today  = new Date().toISOString().slice(0, 10);
    const safeIp = ip.replace(/[.:]/g, "_");
    const ref    = db.collection("rate_limits").doc(safeIp);
    const snap   = await ref.get();
    const counts = snap.exists ? snap.data() : {};
    const current = counts[today] ?? 0;
    if (current >= maxPerDay) return false;
    await ref.set({ [today]: current + 1 }, { merge: true });
    return true;
  } catch (_) {
    // Firestore outage → fail open so apps stay up
    return true;
  }
}

/**
 * Extract the real client IP from an Express/Functions request.
 */
function clientIp(req) {
  return (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
         req.ip ||
         "unknown";
}

module.exports = { checkRateLimit, clientIp };
