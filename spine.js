/* Canopy Spine — the one node model every surface reads and writes (PRD REQ-1, REQ-2, REQ-19, REQ-20).
 * No build step. Expects the Firebase compat SDK and `firebase` global already loaded by the host page,
 * and `firebaseConfig` from /js/config.js. Attaches to window.CanopySpine.
 *
 * Offline-first: writes that cannot reach Firestore queue in localStorage and flush on reconnect (PRD edge cases).
 */
(function (global) {
  'use strict';

  // The ladder (REQ-19). A node has exactly one current rung.
  var RUNGS  = ['capture', 'seed', 'desire', 'project', 'business-candidate', 'service'];
  // Idea Garden stages and layers (existing garden vocabulary).
  var STAGES = ['seed', 'sprout', 'growing', 'fruiting', 'compost'];
  var LAYERS = ['placed', 'pattern', 'substrate', 'myth'];
  // The one gated transition (REQ-21): project -> business-candidate needs a recorded triage verdict.
  var TRIAGE_GATE = { from: 'project', to: 'business-candidate' };

  // v2: key bumped when node creates gained sign-in — orphans the pre-auth backlog
  // of ops that could never have landed (they'd flood the garden on first flush).
  var QUEUE_KEY = 'canopy_spine_queue_v2';
  var STEWARD   = 'jayfcousins@gmail.com';

  function db()  { return global.firebase && global.firebase.firestore ? global.firebase.firestore() : null; }
  function auth() { return global.firebase && global.firebase.auth ? global.firebase.auth() : null; }
  function user() { var a = auth(); return a ? a.currentUser : null; }

  /* Node creates require sign-in (contributors fork seeds as their own).
   * Resolves with the user, or null if auth is unavailable/declined —
   * callers still queue locally so nothing spoken is lost. */
  function ensureAuth() {
    var a = auth();
    if (!a) return Promise.resolve(null);
    if (a.currentUser) return Promise.resolve(a.currentUser);
    var provider = new global.firebase.auth.GoogleAuthProvider();
    return a.signInWithPopup(provider)
      .then(function (res) { return res.user; })
      .catch(function () { return null; });
  }
  function now() { return new Date().toISOString(); }
  function fv()  { return global.firebase.firestore.FieldValue; }

  function slug(s) {
    return String(s || 'node').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'node';
  }
  function rid() { return Math.random().toString(36).slice(2, 7); }

  /* Build a full node from a partial, filling every field of the one shape (REQ-1). */
  function newNode(p) {
    p = p || {};
    return {
      id:       p.id || (slug(p.name) + '-' + rid()),
      name:     p.name || 'Untitled',
      kind:     p.kind || 'note',                 // note | idea | moment | gap | service ...
      summary:  p.summary || '',
      tags:     p.tags || [],
      class:    p.class || 'product',             // product | business  (business unlocks an early service page, REQ-25)
      stage:    p.stage || 'seed',
      rung:     p.rung  || 'capture',
      layer:    p.layer || 'placed',
      geo:      { local_to_dahab: p.geo ? !!p.geo.local_to_dahab : false, place: (p.geo && p.geo.place) || '' },
      people:   p.people || [],
      lineage:  { feeds: (p.lineage && p.lineage.feeds) || [], fed_by: (p.lineage && p.lineage.fed_by) || [] },
      demand:   typeof p.demand === 'number' ? p.demand : 0,
      assets:   p.assets || [],                    // generator output references (REQ-23/26), never floating files
      triageVerdict: p.triageVerdict || null,      // recorded at the gate (REQ-21)
      source_app: p.source_app || 'shell',
      ownerUid: p.ownerUid || (user() ? user().uid : null),
      history:  p.history || [],
      createdAt: p.createdAt || now(),
      updatedAt: now()
    };
  }

  /* ---- offline queue ---- */
  function loadQueue() { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch (e) { return []; } }
  function saveQueue(q) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch (e) {} }
  function enqueue(op) { var q = loadQueue(); q.push(op); saveQueue(q); }

  function flushQueue() {
    if (!db() || !global.navigator.onLine) return Promise.resolve(0);
    var q = loadQueue();
    if (!q.length) return Promise.resolve(0);
    saveQueue([]);                                   // optimistic; failed ops re-queue below
    var chain = Promise.resolve(0);
    q.forEach(function (op) {
      chain = chain.then(function (n) {
        return applyOp(op).then(function () { return n + 1; })
          .catch(function () { enqueue(op); return n; });
      });
    });
    return chain;
  }

  function applyOp(op) {
    var d = db();
    if (op.t === 'set') {
      // Queued-while-signed-out creates get stamped at flush time.
      if (!op.data.ownerUid && user()) op.data.ownerUid = user().uid;
      return d.collection('nodes').doc(op.id).set(op.data, { merge: true });
    }
    if (op.t === 'update') return d.collection('nodes').doc(op.id).update(op.data);
    if (op.t === 'demand') return d.collection('nodes').doc(op.id).set(
      { demand: fv().increment(op.by), updatedAt: now() }, { merge: true });
    if (op.t === 'improve') return d.collection('improvements').doc(op.id).set(op.data);
    return Promise.reject(new Error('unknown op'));
  }

  function run(op) {
    if (db() && global.navigator.onLine) {
      return applyOp(op).catch(function (e) { enqueue(op); throw e; });
    }
    enqueue(op);
    return Promise.resolve({ queued: true });
  }

  /* ---- public writes ---- */

  /* Create a node on the spine. The instant it exists it is in the garden (REQ-9). */
  function createNode(partial) {
    return ensureAuth().then(function (u) {
      var node = newNode(partial);
      if (u && !node.ownerUid) node.ownerUid = u.uid;
      return run({ t: 'set', id: node.id, data: node }).then(function () { return node; });
    });
  }

  /* The single dispatcher (REQ-20). Pull (demand) or push (steward) a node up exactly one rung.
   * Enforces the triage gate as a hard refusal (REQ-21). */
  function advance(node, opts) {
    opts = opts || {};
    var i = RUNGS.indexOf(node.rung);
    if (i < 0 || i >= RUNGS.length - 1) return Promise.reject(new Error('cannot advance from rung ' + node.rung));
    var next = RUNGS[i + 1];
    if (node.rung === TRIAGE_GATE.from && next === TRIAGE_GATE.to && !(opts.triageVerdict || node.triageVerdict)) {
      return Promise.reject(new Error('triage gate: no verdict, no advance (REQ-21)'));
    }
    var entry = { at: now(), from: node.rung, to: next, by: opts.by || STEWARD, reason: opts.reason || '' };
    var data = {
      rung: next, updatedAt: now(),
      history: (node.history || []).concat([entry])
    };
    if (opts.triageVerdict) data.triageVerdict = opts.triageVerdict;
    return run({ t: 'update', id: node.id, data: data }).then(function () { return next; });
  }

  /* Backing a desire increments the one demand signal (REQ-17). Same path used by a service page. */
  function backDemand(nodeId, by) {
    return run({ t: 'demand', id: nodeId, by: by || 1 });
  }

  /* Spoken intent only, written to the improvements queue. Calls no AI itself (REQ-28).
   * `target` may be a surface OR the wiring (spine/ladder/dispatcher/generators) — REQ-30. */
  /* MUST authenticate, and `by` MUST be the real signed-in address.
   *
   * This used to write anonymously with `by` defaulting to the steward's address, which meant
   * the queue could not tell Jay's intent from a stranger's. The watcher feeds `intent` to
   * Claude Code with accept-edits and then deploys, so an unattributable queue was a path from
   * "anyone who reads /shell/spine.js" to "a code change shipped overnight".
   *
   * `by` is now taken from the token rather than from the caller, and the rules require it to
   * equal the authenticated address, so it cannot be forged by hand-rolling a write. The
   * watcher refuses anything whose `by` is not the steward. Producer, rule and consumer all
   * have to agree, which is the point. */
  function queueImprovement(req) {
    req = req || {};
    return ensureAuth().then(function (u) {
      if (!u || !u.email) throw new Error('sign in before queueing an improvement');
      var id = 'imp-' + Date.now() + '-' + rid();
      var data = {
        id: id,
        target: req.target || 'shell',     // which layer/app/wiring to reshape
        app: req.app || req.target || 'shell',
        intent: String(req.intent || '').slice(0, 2000),
        status: 'queued',                  // queued | applying | done | failed (honest status, Risk #2)
        by: u.email,                       // from the token, never from the caller
        ownerUid: u.uid,
        createdAt: now()
      };
      return run({ t: 'improve', id: id, data: data }).then(function () { return data; });
    });
  }

  /* Live read of the spine for the feed/galaxy (REQ-14/16). */
  function listenNodes(cb, onErr) {
    var d = db();
    if (!d) { cb([]); return function () {}; }
    return d.collection('nodes').orderBy('updatedAt', 'desc').limit(500)
      .onSnapshot(function (snap) {
        var out = []; snap.forEach(function (doc) { out.push(doc.data()); }); cb(out);
      }, onErr || function () {});
  }

  if (global.addEventListener) global.addEventListener('online', function () { flushQueue(); });

  global.CanopySpine = {
    RUNGS: RUNGS, STAGES: STAGES, LAYERS: LAYERS, TRIAGE_GATE: TRIAGE_GATE, STEWARD: STEWARD,
    newNode: newNode, createNode: createNode, advance: advance, backDemand: backDemand,
    queueImprovement: queueImprovement, listenNodes: listenNodes, flushQueue: flushQueue,
    ensureAuth: ensureAuth, currentUser: user,
    pendingCount: function () { return loadQueue().length; }
  };
})(window);
