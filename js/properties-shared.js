// ===================== FIREBASE-BACKED API =====================
// Requires firebase-config.js to be loaded first.
// Property data lives in the Realtime Database under /properties,
// so it's shared across every device/browser instead of being local to one.
const propertiesDbRef = firebase.database().ref('properties');

// In-memory cache to prevent duplicate reads within the same page load
var _apiCache = null;
var _apiCacheTime = 0;
var _apiCacheTTL = 30000; // 30 seconds

const NestFinderAPI = (function() {
  function ensureSeeded() {
    return Promise.resolve();
  }

  async function fetchAll(forceRefresh) {
    if (!forceRefresh && _apiCache && Date.now() - _apiCacheTime < _apiCacheTTL) {
      return _apiCache;
    }
    await ensureSeeded();
    const snap = await propertiesDbRef.once('value');
    const data = snap.val();
    if (!data) {
      _apiCache = [];
    } else {
      _apiCache = Object.keys(data).map(key => ({ firebaseKey: key, ...data[key] }));
    }
    _apiCacheTime = Date.now();
    return _apiCache;
  }

  // Quick count without fetching full data
  async function fetchCount() {
    const snap = await propertiesDbRef.once('value');
    const data = snap.val();
    return data ? Object.keys(data).length : 0;
  }

  return {
    fetchAll,

    fetchCount,

    getById: async function(id) {
      // Check cache first
      if (_apiCache) {
        var found = _apiCache.find(function(p) { return p.id === parseInt(id, 10) || p.firebaseKey === id; });
        if (found) return found;
      }
      await ensureSeeded();
      const snap = await propertiesDbRef.orderByChild('id').equalTo(parseInt(id, 10)).once('value');
      const data = snap.val();
      if (!data) return null;
      const key = Object.keys(data)[0];
      return { firebaseKey: key, ...data[key] };
    },

    create: async function(formData) {
      _apiCache = null;
      const all = await fetchAll();
      const newId = all.length ? Math.max(...all.map(p => p.id || 0)) + 1 : 1;
      const newProp = { ...formData, id: newId, createdAt: new Date().toISOString() };
      const newRef = propertiesDbRef.push();
      await newRef.set(newProp);
      return { firebaseKey: newRef.key, ...newProp };
    },

    update: async function(id, formData) {
      _apiCache = null;
      const snap = await propertiesDbRef.orderByChild('id').equalTo(parseInt(id, 10)).once('value');
      const data = snap.val();
      if (!data) throw new Error('Property not found');
      const key = Object.keys(data)[0];
      await propertiesDbRef.child(key).update(formData);
      return { firebaseKey: key, ...data[key], ...formData };
    },

    delete: async function(id) {
      _apiCache = null;
      const snap = await propertiesDbRef.orderByChild('id').equalTo(parseInt(id, 10)).once('value');
      const data = snap.val();
      if (!data) return false;
      const key = Object.keys(data)[0];
      await propertiesDbRef.child(key).remove();
      return true;
    },

    // Wipes every property from the database. No more re-seeding with dummy
    // data — after this runs, the catalog is genuinely empty until real
    // listings are added again via "Add Property".
    reset: async function() {
      await propertiesDbRef.remove();
      return [];
    },

    // Deletes ONLY the old auto-generated dummy/demo listings that were
    // seeded into the database before auto-seeding was removed, while
    // keeping every real listing a seller actually added through
    // "Add Property". Real listings always carry a `userId` field
    // (set in acc.html when the form is submitted); the old dummy
    // listings never had one — that's how the two are told apart.
    // Safe to run more than once.
    removeDummyData: async function() {
      const snap = await propertiesDbRef.once('value');
      const data = snap.val();
      if (!data) return { removed: 0, kept: 0 };

      const updates = {};
      let removed = 0;
      let kept = 0;
      Object.keys(data).forEach(key => {
        if (!data[key].userId) {
          updates[key] = null; // deletes this key
          removed++;
        } else {
          kept++;
        }
      });

      if (removed > 0) {
        await propertiesDbRef.update(updates);
      }
      return { removed, kept };
    }
  };
})();

window.NestFinderAPI = NestFinderAPI;

// Convenience: get only properties posted by a specific user (used by acc.html "My Properties")
window.NestFinderAPI.getByUser = async function(userId) {
  const all = await window.NestFinderAPI.fetchAll();
  return all.filter(p => p.userId === userId);
};
