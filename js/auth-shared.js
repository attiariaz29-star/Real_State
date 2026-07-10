// ============================================================
// NestFinder AI — Shared Auth Module (Firebase Authentication)
// Real account, works across any device/browser once signed up.
// Used by acc.html and any page that needs to know who's logged in.
// Requires firebase-config.js to be loaded first.
// ============================================================
(function () {
  const auth = firebase.auth();

  function toSessionUser(firebaseUser) {
    if (!firebaseUser) return null;
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
      email: firebaseUser.email
    };
  }

  function friendlyError(err) {
    const map = {
      'auth/email-already-in-use': 'An account with this email already exists. Please sign in instead.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/user-not-found': 'Invalid email or password.',
      'auth/wrong-password': 'Invalid email or password.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/too-many-requests': 'Too many attempts. Please try again in a moment.'
    };
    return new Error(map[err.code] || err.message || 'Something went wrong. Please try again.');
  }

  const Auth = {
    // Synchronous snapshot — may be null for a moment on page load until
    // Firebase resolves the persisted session. Use onChange() for reliable UI updates.
    getCurrentUser() {
      return toSessionUser(auth.currentUser);
    },

    // Fires immediately with the current state, then again whenever it changes
    // (login, logout, or session restored on page load/another tab).
    onChange(callback) {
      auth.onAuthStateChanged(firebaseUser => callback(toSessionUser(firebaseUser)));
    },

    async register(name, email, password) {
      name = (name || "").trim();
      email = (email || "").trim().toLowerCase();
      if (!name || !email || !password) {
        throw new Error("Please fill in all fields.");
      }
      try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: name });
        return { id: cred.user.uid, name, email: cred.user.email };
      } catch (err) {
        throw friendlyError(err);
      }
    },

    async login(email, password) {
      email = (email || "").trim().toLowerCase();
      try {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        return toSessionUser(cred.user);
      } catch (err) {
        throw friendlyError(err);
      }
    },

    async logout() {
      await auth.signOut();
    }
  };

  window.NestFinderAuth = Auth;
})();
