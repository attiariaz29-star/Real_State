(function () {
  var NAVBAR_HTML = `
<nav class="navbar navbar-expand-lg fixed-top" id="mainNav" role="navigation" aria-label="Main navigation">
  <div class="container">
    <a class="navbar-brand" href="index.html" aria-label="NestFinder AI Home">
      <i class="bi bi-house-heart-fill me-2"></i>
      <span class="brand-text">NestFinder</span><span class="brand-gold">AI</span>
    </a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav mx-auto align-items-center" id="navCenterLinks">
        <li class="nav-item"><a class="nav-link" href="index.html" data-page="index">Home</a></li>
        <li class="nav-item"><a class="nav-link" href="property.html" data-page="property">Properties</a></li>
        <li class="nav-item"><a class="nav-link" href="area-insight.html" data-page="area-insight">Area Insights</a></li>
        <li class="nav-item"><a class="nav-link" href="ai-recommendations.html" data-page="ai-recommendations">AI Match</a></li>
        <li class="nav-item"><a class="nav-link" href="market-insights.html" data-page="market-insights">Market</a></li>
      </ul>
      <ul class="navbar-nav align-items-center" id="navRightItems">
        <li class="nav-item">
          <button class="btn btn-outline-light btn-sm theme-toggle" id="themeToggle" aria-label="Toggle dark mode">
            <i class="bi bi-moon-stars-fill" id="themeIcon"></i>
          </button>
        </li>
        <li class="nav-item guest-item" id="navSignInItem">
          <a href="#" class="nav-link" id="guestSignInLink"><i class="bi bi-box-arrow-in-right me-1"></i>Sign In</a>
        </li>
        <li class="nav-item guest-item" id="navSignUpItem">
          <a href="#" class="nf-btn-primary" id="guestSignUpBtn"><i class="bi bi-person me-1"></i> Sign Up</a>
        </li>
        <li class="nav-item auth-item" id="navBellItem" style="display:none;">
          <button class="btn nav-link position-relative" id="notificationBell" aria-label="Notifications">
            <i class="bi bi-bell-fill" style="font-size:1.1rem;line-height:1;"></i>
            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size:0.55rem;display:none;" id="notifBadge">0</span>
          </button>
        </li>
        <li class="nav-item dropdown auth-item" id="navAvatarItem" style="display:none;">
          <a class="nav-link dropdown-toggle d-flex align-items-center gap-1" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" id="navAvatarBtn" aria-label="User menu">
            <span id="navAvatarCircle" class="d-flex align-items-center justify-content-center" style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;font-weight:800;font-size:0.85rem;overflow:hidden;flex-shrink:0;">
              <i class="bi bi-person-fill" id="defaultAvatarIcon" style="font-size:1.1rem;display:flex;"></i>
              <img id="profileAvatarImg" style="width:100%;height:100%;object-fit:cover;display:none;" alt="Profile photo">
            </span>
            <span id="navAvatarName" class="d-none d-lg-inline" style="font-weight:600;font-size:0.85rem;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">User</span>
          </a>
          <ul class="dropdown-menu dropdown-menu-end" id="navDropdown">
            <li><a class="dropdown-item" href="acc.html"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
            <li><a class="dropdown-item" href="user-profile.html"><i class="bi bi-person-circle me-2"></i>Profile</a></li>
            <li><a class="dropdown-item" href="saved-properties.html"><i class="bi bi-bookmark me-2"></i>Saved</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" id="navLogoutLink"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</nav>`;

  var EDIT_PROFILE_MODAL_HTML = `
<div class="modal fade" id="navEditProfileModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content" style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:1.25rem;color:var(--text-body);box-shadow:0 20px 40px rgba(0,0,0,0.8);">
      <div class="modal-header" style="border-bottom:1px solid var(--border-color);padding:1.5rem;">
        <h5 class="modal-title" style="font-weight:700;"><i class="bi bi-pencil-square me-2" style="color:var(--primary);"></i>Edit Profile</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" style="filter:invert(1) grayscale(1) brightness(2);"></button>
      </div>
      <div class="modal-body" style="padding:1.5rem;">
        <div class="text-center mb-4">
          <div id="navEditProfileAvatar" style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:2rem;overflow:hidden;border:3px solid rgba(245,158,11,0.3);margin:0 auto;">
            U
          </div>
          <div class="mt-2">
            <label for="navProfilePicUpload" class="btn btn-sm btn-outline-warning" style="border-radius:0.5rem;cursor:pointer;">
              <i class="bi bi-camera me-1"></i> Upload Photo
            </label>
            <input type="file" id="navProfilePicUpload" accept="image/*" style="display:none;">
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label" style="font-size:0.85rem;font-weight:600;">Name</label>
          <input type="text" id="navEditProfileName" class="form-control" placeholder="Your name" style="background:var(--bg-input, rgba(255,255,255,0.06));border:1px solid var(--border-color);color:var(--text-body);border-radius:0.75rem;padding:0.65rem 1rem;">
        </div>
        <div class="mb-3">
          <label class="form-label" style="font-size:0.85rem;font-weight:600;">Email</label>
          <input type="email" id="navEditProfileEmail" class="form-control" readonly style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);color:#9ca3af;border-radius:0.75rem;padding:0.65rem 1rem;">
        </div>
        <div id="navEditProfileAlert" class="alert d-none" role="alert" style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);color:#86efac;border-radius:0.75rem;padding:0.75rem 1rem;">
          Profile updated successfully!
        </div>
      </div>
      <div class="modal-footer" style="border-top:1px solid var(--border-color);padding:1rem 1.5rem;">
        <button type="button" class="btn w-100 py-2" id="navBtnSaveProfile" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;font-weight:700;border:none;border-radius:0.75rem;">
          <i class="bi bi-check-lg me-1"></i> Save Changes
        </button>
      </div>
    </div>
  </div>
</div>`;

  var AUTH_MODAL_HTML = `
<div class="modal fade" id="authModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content" style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:1.25rem;color:var(--text-body);box-shadow:0 20px 40px rgba(0,0,0,0.8);">
      <div class="modal-header" style="border-bottom:1px solid var(--border-color);padding:1.5rem;">
        <h5 class="modal-title" style="font-weight:700;"><i class="bi bi-shield-lock me-2" style="color:var(--primary);"></i>NestFinder AI Account</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" style="filter:invert(1) grayscale(1) brightness(2);"></button>
      </div>
      <div class="modal-body" style="padding:1.5rem;">
        <div class="d-flex gap-2 mb-3" style="border-bottom:1px solid var(--border-color);padding-bottom:0.75rem;">
          <button id="modal-tab-login" class="active" style="background:rgba(245,158,11,0.12);border:none;padding:0.5rem 1rem;border-radius:0.5rem;font-weight:600;color:var(--text-heading);cursor:pointer;">Sign In</button>
          <button id="modal-tab-register" style="background:none;border:none;padding:0.5rem 1rem;border-radius:0.5rem;font-weight:600;color:var(--text-muted);cursor:pointer;">Sign Up</button>
        </div>
        <div id="auth-alert" class="alert d-none" style="background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.3);color:#fca5a5;border-radius:0.75rem;padding:0.75rem 1rem;font-size:0.9rem;"></div>
        <form id="nav-login-form">
          <div class="mb-3">
            <label for="nav-login-email" class="form-label" style="font-size:0.85rem;font-weight:600;">Email Address</label>
            <input type="email" id="nav-login-email" class="form-control" placeholder="name@example.com" required style="background:var(--bg-input, rgba(255,255,255,0.06));border:1px solid var(--border-color);color:var(--text-body);border-radius:0.75rem;padding:0.65rem 1rem;">
          </div>
          <div class="mb-4">
            <label for="nav-login-password" class="form-label" style="font-size:0.85rem;font-weight:600;">Password</label>
            <input type="password" id="nav-login-password" class="form-control" placeholder="••••••••" required style="background:var(--bg-input, rgba(255,255,255,0.06));border:1px solid var(--border-color);color:var(--text-body);border-radius:0.75rem;padding:0.65rem 1rem;">
          </div>
          <button type="submit" class="btn w-100 py-2" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;font-weight:700;border:none;border-radius:0.75rem;">
            <i class="bi bi-box-arrow-in-right me-1"></i> Sign In
          </button>
        </form>
        <form id="nav-register-form" class="d-none">
          <div class="mb-3">
            <label for="nav-reg-name" class="form-label" style="font-size:0.85rem;font-weight:600;">Full Name</label>
            <input type="text" id="nav-reg-name" class="form-control" placeholder="John Doe" required style="background:var(--bg-input, rgba(255,255,255,0.06));border:1px solid var(--border-color);color:var(--text-body);border-radius:0.75rem;padding:0.65rem 1rem;">
          </div>
          <div class="mb-3">
            <label for="nav-reg-email" class="form-label" style="font-size:0.85rem;font-weight:600;">Email Address</label>
            <input type="email" id="nav-reg-email" class="form-control" placeholder="john@example.com" required style="background:var(--bg-input, rgba(255,255,255,0.06));border:1px solid var(--border-color);color:var(--text-body);border-radius:0.75rem;padding:0.65rem 1rem;">
          </div>
          <div class="mb-3">
            <label for="nav-reg-password" class="form-label" style="font-size:0.85rem;font-weight:600;">Password</label>
            <input type="password" id="nav-reg-password" class="form-control" placeholder="Minimum 6 characters" minlength="6" required style="background:var(--bg-input, rgba(255,255,255,0.06));border:1px solid var(--border-color);color:var(--text-body);border-radius:0.75rem;padding:0.65rem 1rem;">
          </div>
          <div class="mb-4">
            <label for="nav-reg-password-confirm" class="form-label" style="font-size:0.85rem;font-weight:600;">Confirm Password</label>
            <input type="password" id="nav-reg-password-confirm" class="form-control" placeholder="Repeat password" required style="background:var(--bg-input, rgba(255,255,255,0.06));border:1px solid var(--border-color);color:var(--text-body);border-radius:0.75rem;padding:0.65rem 1rem;">
          </div>
          <button type="submit" class="btn w-100 py-2" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;font-weight:700;border:none;border-radius:0.75rem;">
            <i class="bi bi-person-plus me-1"></i> Create Account
          </button>
        </form>
      </div>
    </div>
  </div>
</div>`;

  function injectNavbar() {
    var root = document.getElementById('navbar-root');
    if (!root) return;
    root.innerHTML = NAVBAR_HTML;
  }

  function getPageId() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    var map = {
      'index.html': 'index',
      'property.html': 'property',
      'listing.html': 'listing',
      'area-insight.html': 'area-insight',
      'ai-recommendations.html': 'ai-recommendations',
      'acc.html': 'acc',
      'dashboard.html': 'dashboard'
    };
    return map[path] || 'index';
  }

  function highlightActive() {
    var page = getPageId();
    document.querySelectorAll('#navCenterLinks .nav-link').forEach(function (link) {
      if (link.dataset.page === page) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  function initTheme() {
    var toggle = document.getElementById('themeToggle');
    var icon = document.getElementById('themeIcon');
    var html = document.documentElement;
    if (!toggle || !icon) return;
    var saved = localStorage.getItem('nestfinder_theme') || localStorage.getItem('nestfinder-theme') || 'light';
    html.setAttribute('data-bs-theme', saved);
    icon.className = saved === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    toggle.addEventListener('click', function () {
      var next = html.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-bs-theme', next);
      localStorage.setItem('nestfinder_theme', next);
      localStorage.removeItem('nestfinder-theme');
      icon.className = next === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    });
  }

  function initScrolled() {
    var nav = document.getElementById('mainNav');
    if (!nav) return;
    function update() {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  var _userMeta = null;

  function loadUserMeta(uid) {
    if (!uid || !window.firebase) return;
    try {
      firebase.database().ref('users/' + uid + '/meta').once('value', function (snap) {
        _userMeta = snap.val() || null;
        updateAvatar();
      });
    } catch (e) {}
  }

  function updateAvatar() {
    var circle = document.getElementById('navAvatarCircle');
    var icon = document.getElementById('defaultAvatarIcon');
    var img = document.getElementById('profileAvatarImg');
    if (!circle) return;
    var pic = _userMeta && _userMeta.profilePic;
    if (pic) {
      if (icon) icon.style.display = 'none';
      if (img) {
        img.src = pic;
        img.style.display = 'block';
      }
      if (circle) circle.style.background = 'none';
    } else {
      if (icon) icon.style.display = 'flex';
      if (img) { img.style.display = 'none'; img.src = ''; }
      if (circle) circle.style.background = 'linear-gradient(135deg,#f59e0b,#d97706)';
    }
  }

  function updateNavbar(user) {
    var guestItems = document.querySelectorAll('.guest-item');
    var authItems = document.querySelectorAll('.auth-item');
    var nameEl = document.getElementById('navAvatarName');
    var circle = document.getElementById('navAvatarCircle');
    var icon = document.getElementById('defaultAvatarIcon');
    var img = document.getElementById('profileAvatarImg');

    if (user) {
      guestItems.forEach(function (el) { el.style.display = 'none'; });
      authItems.forEach(function (el) { el.style.display = ''; });
      if (nameEl) nameEl.textContent = user.name || 'User';
      loadUserMeta(user.id);
      if (document.getElementById('notifBadge')) {
        document.getElementById('notifBadge').style.display = 'none';
      }
    } else {
      guestItems.forEach(function (el) { el.style.display = ''; });
      authItems.forEach(function (el) { el.style.display = 'none'; });
      if (circle) {
        if (icon) icon.style.display = 'flex';
        if (img) { img.style.display = 'none'; img.src = ''; }
        if (circle) circle.style.background = 'linear-gradient(135deg,#f59e0b,#d97706)';
      }
      if (nameEl) nameEl.textContent = 'User';
      _userMeta = null;
    }
  }

  function initAuth() {
    var logoutLink = document.getElementById('navLogoutLink');
    if (logoutLink) {
      logoutLink.addEventListener('click', function (e) {
        e.preventDefault();
        var dd = document.getElementById('navAvatarBtn');
        if (dd) {
          var bsDrop = bootstrap.Dropdown.getInstance(dd);
          if (bsDrop) bsDrop.hide();
        }
        if (window.NestFinderAuth && typeof NestFinderAuth.logout === 'function') {
          NestFinderAuth.logout();
        }
      });
    }

    if (window.NestFinderAuth && typeof NestFinderAuth.onChange === 'function') {
      NestFinderAuth.onChange(function (user) {
        updateNavbar(user);
      });
      updateNavbar(NestFinderAuth.getCurrentUser());
    } else {
      var guestItems = document.querySelectorAll('.guest-item');
      guestItems.forEach(function (el) { el.style.display = ''; });
    }
  }

  function checkDashboard() {
    var el = document.getElementById('navDashboardItem');
    if (!el) return;
    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', 'dashboard.html', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        el.style.display = xhr.status === 200 ? '' : 'none';
      }
    };
    xhr.send();
  }

  /* ─── Auth Modal Logic ─── */
  function showAuthTab(tab) {
    var loginForm = document.getElementById('nav-login-form');
    var regForm = document.getElementById('nav-register-form');
    var tabLogin = document.getElementById('modal-tab-login');
    var tabReg = document.getElementById('modal-tab-register');
    if (!loginForm || !regForm || !tabLogin || !tabReg) return;

    if (tab === 'login') {
      loginForm.classList.remove('d-none');
      regForm.classList.add('d-none');
      tabLogin.style.cssText = 'background:rgba(245,158,11,0.12);border:none;padding:0.5rem 1rem;border-radius:0.5rem;font-weight:600;color:var(--text-heading);cursor:pointer;';
      tabReg.style.cssText = 'background:none;border:none;padding:0.5rem 1rem;border-radius:0.5rem;font-weight:600;color:var(--text-muted);cursor:pointer;';
    } else {
      loginForm.classList.add('d-none');
      regForm.classList.remove('d-none');
      tabReg.style.cssText = 'background:rgba(245,158,11,0.12);border:none;padding:0.5rem 1rem;border-radius:0.5rem;font-weight:600;color:var(--text-heading);cursor:pointer;';
      tabLogin.style.cssText = 'background:none;border:none;padding:0.5rem 1rem;border-radius:0.5rem;font-weight:600;color:var(--text-muted);cursor:pointer;';
    }
  }

  /* only attach to injected modal's form IDs, not acc.html's native ones */
  function attachFormHandlers() {
    var loginForm = document.getElementById('nav-login-form');
    var regForm = document.getElementById('nav-register-form');

    if (loginForm) {
      loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var email = document.getElementById('nav-login-email').value.trim();
        var password = document.getElementById('nav-login-password').value;
        if (!window.NestFinderAuth) { showAuthAlert('Auth not ready. Try again.', 'danger'); return; }
        try {
          await NestFinderAuth.login(email, password);
          var modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
          if (modal) modal.hide();
          window.location.href = 'acc.html';
        } catch (err) {
          showAuthAlert(err.message, 'danger');
        }
      });
    }

    if (regForm) {
      regForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var name = document.getElementById('nav-reg-name').value.trim();
        var email = document.getElementById('nav-reg-email').value.trim();
        var password = document.getElementById('nav-reg-password').value;
        var confirm = document.getElementById('nav-reg-password-confirm').value;
        if (password !== confirm) { showAuthAlert('Passwords do not match.', 'danger'); return; }
        if (!window.NestFinderAuth) { showAuthAlert('Auth not ready. Try again.', 'danger'); return; }
        try {
          await NestFinderAuth.register(name, email, password);
          var modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
          if (modal) modal.hide();
          window.location.href = 'acc.html';
        } catch (err) {
          showAuthAlert(err.message, 'danger');
        }
      });
    }
  }

  var _modalInjected = false;

  function injectAuthModal() {
    if (document.getElementById('authModal')) return;
    var div = document.createElement('div');
    div.innerHTML = AUTH_MODAL_HTML;
    document.body.appendChild(div.firstElementChild);
    _modalInjected = true;
  }

  function injectEditProfileModal() {
    if (document.getElementById('navEditProfileModal')) return;
    var div = document.createElement('div');
    div.innerHTML = EDIT_PROFILE_MODAL_HTML;
    document.body.appendChild(div.firstElementChild);
  }

  function openNavEditProfile() {
    injectEditProfileModal();
    var nameInput = document.getElementById('navEditProfileName');
    var emailInput = document.getElementById('navEditProfileEmail');
    var avatarEl = document.getElementById('navEditProfileAvatar');
    var user = NestFinderAuth && NestFinderAuth.getCurrentUser ? NestFinderAuth.getCurrentUser() : null;
    if (nameInput) nameInput.value = user ? (user.name || '') : '';
    if (emailInput) emailInput.value = user ? (user.email || '') : '';
    if (avatarEl) {
      var pic = _userMeta && _userMeta.profilePic;
      if (pic) {
        avatarEl.innerHTML = '<img src="' + pic + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
      } else {
        avatarEl.textContent = (user ? (user.name || 'U') : 'U')[0].toUpperCase();
        avatarEl.style.background = 'linear-gradient(135deg,#f59e0b,#d97706)';
      }
    }
    document.getElementById('navEditProfileAlert').classList.add('d-none');
    var modal = new bootstrap.Modal(document.getElementById('navEditProfileModal'));
    modal.show();
  }

  function initEditProfileModal() {
    var profileLink = document.getElementById('navProfileLink');
    if (profileLink) {
      profileLink.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.NestFinderAuth && NestFinderAuth.getCurrentUser()) {
          openNavEditProfile();
        } else {
          window.location.href = 'acc.html';
        }
      });
    }

    // Profile pic upload
    var uploadInput = document.getElementById('navProfilePicUpload');
    if (uploadInput) {
      uploadInput.addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
          var img = new Image();
          img.onload = function () {
            var canvas = document.createElement('canvas');
            var maxW = 300, maxH = 300;
            var w = img.width, h = img.height;
            if (w > maxW) { h = h * maxW / w; w = maxW; }
            if (h > maxH) { w = w * maxH / h; h = maxH; }
            canvas.width = w; canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            var dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            var avatarEl = document.getElementById('navEditProfileAvatar');
            if (avatarEl) {
              avatarEl.innerHTML = '<img src="' + dataUrl + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
              avatarEl.setAttribute('data-pic', dataUrl);
            }
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    // Save profile
    var saveBtn = document.getElementById('navBtnSaveProfile');
    if (saveBtn) {
      saveBtn.addEventListener('click', async function () {
        var user = NestFinderAuth && NestFinderAuth.getCurrentUser ? NestFinderAuth.getCurrentUser() : null;
        if (!user) return;
        var btn = this;
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-arrow-repeat spin me-1"></i> Saving...';
        try {
          var nameInput = document.getElementById('navEditProfileName');
          var avatarEl = document.getElementById('navEditProfileAvatar');
          var pic = avatarEl ? avatarEl.getAttribute('data-pic') : null;
          var meta = { name: nameInput ? nameInput.value : user.name, email: user.email, updatedAt: new Date().toISOString() };
          if (pic) meta.profilePic = pic;
          if (!_userMeta || !_userMeta.createdAt) meta.createdAt = new Date().toISOString();
          await firebase.database().ref('users/' + user.id + '/meta').update(meta);
          user.name = meta.name;
          if (!_userMeta) _userMeta = {};
          _userMeta.profilePic = pic;
          _userMeta.name = meta.name;
          updateAvatar();
          var nameEl = document.getElementById('navAvatarName');
          if (nameEl) nameEl.textContent = user.name || 'User';
          var alertEl = document.getElementById('navEditProfileAlert');
          if (alertEl) {
            alertEl.classList.remove('d-none');
            setTimeout(function () { alertEl.classList.add('d-none'); }, 3000);
          }
        } catch (err) {
          alert('Failed to save: ' + err.message);
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Save Changes';
        }
      });
    }
  }

  function showAuthAlert(msg, type) {
    var el = document.getElementById('auth-alert');
    if (!el) return;
    el.textContent = msg;
    el.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-danger') + ' show';
    el.style.display = 'block';
    setTimeout(function () { el.style.display = 'none'; }, 4000);
  }

  function initAuthModal() {
    var signInLink = document.getElementById('guestSignInLink');
    var signUpBtn = document.getElementById('guestSignUpBtn');
    if (!signInLink && !signUpBtn) return;

    if (!document.getElementById('authModal')) injectAuthModal();

    function openModal(tab) {
      var modalEl = document.getElementById('authModal');
      if (!modalEl) return;

      /* If native acc.html tabs exist, click them directly */
      var nativeLoginTab = document.getElementById('tab-login');
      var nativeRegTab = document.getElementById('tab-register');
      if (tab === 'register' && nativeRegTab) {
        nativeRegTab.click();
      } else if (nativeLoginTab) {
        nativeLoginTab.click();
      } else {
        /* Injected modal — use our own tab switcher */
        showAuthTab(tab);
      }

      var modal = new bootstrap.Modal(modalEl);
      modal.show();
    }

    if (signInLink) {
      signInLink.addEventListener('click', function (e) {
        e.preventDefault();
        openModal('login');
      });
    }

    if (signUpBtn) {
      signUpBtn.addEventListener('click', function (e) {
        e.preventDefault();
        openModal('register');
      });
    }

    var tabLogin = document.getElementById('modal-tab-login');
    var tabReg = document.getElementById('modal-tab-register');
    if (tabLogin) tabLogin.addEventListener('click', function () { showAuthTab('login'); });
    if (tabReg) tabReg.addEventListener('click', function () { showAuthTab('register'); });

    /* Only attach form handlers on injected modal (nav-* prefixed IDs),
       not on acc.html's native modal which has its own handlers */
    if (_modalInjected) attachFormHandlers();
  }

  function bootstrapNavbar() {
    injectNavbar();
    highlightActive();
    initTheme();
    initScrolled();
    initAuth();
    initAuthModal();
    initEditProfileModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapNavbar);
  } else {
    bootstrapNavbar();
  }
})();
