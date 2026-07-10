// ============================================================
// NestFinder AI — Property Reviews & Ratings
// Requires firebase-config.js loaded first. No login required —
// each visitor gets a persistent local reviewer id (localStorage)
// so they can come back later and edit/delete their own review.
//
// Data shape in Realtime Database:
// /reviews/{propertyId}/{reviewId} = {
//   authorId, authorName, rating (1-5), comment, timestamp, updatedAt
// }
// ============================================================
(function () {
  const reviewsRef = (propertyId) => firebase.database().ref('reviews').child(safeKey(propertyId));

  function safeKey(str) {
    return String(str).replace(/[.#$\[\]\/]/g, '_');
  }

  function getReviewerId() {
    let id = localStorage.getItem('nf_reviewer_id');
    if (!id) {
      id = 'user-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('nf_reviewer_id', id);
    }
    return id;
  }

  function getSavedName() {
    return localStorage.getItem('nf_reviewer_name') || '';
  }

  function saveName(name) {
    localStorage.setItem('nf_reviewer_name', name.trim());
  }

  function injectStyles() {
    if (document.getElementById('nf-reviews-styles')) return;
    const style = document.createElement('style');
    style.id = 'nf-reviews-styles';
    style.textContent = `
      .nf-rev-summary { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; }
      .nf-rev-avg { font-size: 2rem; font-weight: 800; color: #f59e0b; line-height: 1; }
      .nf-rev-stars { color: #f59e0b; font-size: 1rem; letter-spacing: 1px; }
      .nf-rev-count { font-size: 0.8rem; color: #888; }
      .nf-rev-star-input { font-size: 1.6rem; cursor: pointer; color: #d1d5db; transition: color 0.15s; }
      .nf-rev-star-input.active, .nf-rev-star-input:hover { color: #f59e0b; }
      .nf-rev-form { background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.2); border-radius: 14px; padding: 1rem 1.1rem; margin-bottom: 1.25rem; }
      .nf-rev-item { border-bottom: 1px solid rgba(0,0,0,0.07); padding: 0.9rem 0; }
      [data-bs-theme="dark"] .nf-rev-item { border-color: rgba(245,158,11,0.15); }
      .nf-rev-item:last-child { border-bottom: none; }
      .nf-rev-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg,#f59e0b,#d97706); color:#000; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.9rem; flex-shrink:0; }
      .nf-rev-name { font-weight: 600; font-size: 0.9rem; }
      .nf-rev-date { font-size: 0.72rem; color: #999; }
      .nf-rev-comment { font-size: 0.87rem; margin-top: 0.25rem; line-height: 1.5; }
      .nf-rev-actions button { font-size: 0.75rem; }
      .nf-rev-empty { color: #999; font-size: 0.85rem; padding: 0.5rem 0 1rem; }
    `;
    document.head.appendChild(style);
  }

  function starsHtml(rating, size) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += `<i class="bi ${i <= rating ? 'bi-star-fill' : 'bi-star'}"></i>`;
    }
    return `<span class="${size === 'sm' ? '' : 'nf-rev-stars'}">${html}</span>`;
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
  }

  function dateLabel(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  }

  let activeListenerOff = null;
  let selectedRating = 0;

  function renderInto(containerId, propertyId) {
    injectStyles();
    const container = document.getElementById(containerId);
    if (!container) return;

    if (activeListenerOff) { activeListenerOff(); activeListenerOff = null; }
    selectedRating = 0;

    const myId = getReviewerId();

    container.innerHTML = `
      <h5 class="fs-6 fw-bold mb-3"><i class="bi bi-chat-square-heart-fill text-yellow me-2"></i>Reviews &amp; Ratings</h5>
      <div class="nf-rev-summary" id="nfRevSummary"></div>
      <div class="nf-rev-form" id="nfRevForm"></div>
      <div id="nfRevList"></div>
    `;

    const ref = reviewsRef(propertyId).orderByChild('timestamp');
    const listener = (snap) => {
      const data = snap.val();
      const list = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      renderSummary(list);
      renderForm(propertyId, myId, list.find(r => r.authorId === myId) || null);
      renderList(propertyId, myId, list);
    };
    ref.on('value', listener);
    activeListenerOff = () => ref.off('value', listener);
  }

  function renderSummary(list) {
    const el = document.getElementById('nfRevSummary');
    if (!el) return;
    if (!list.length) {
      el.innerHTML = `<span class="text-muted small">No reviews yet — be the first to rate this property.</span>`;
      return;
    }
    const avg = list.reduce((s, r) => s + Number(r.rating || 0), 0) / list.length;
    el.innerHTML = `
      <div class="nf-rev-avg">${avg.toFixed(1)}</div>
      <div>
        ${starsHtml(Math.round(avg))}
        <div class="nf-rev-count">${list.length} review${list.length === 1 ? '' : 's'}</div>
      </div>
    `;
  }

  function renderForm(propertyId, myId, myReview) {
    const el = document.getElementById('nfRevForm');
    if (!el) return;
    selectedRating = myReview ? myReview.rating : 0;

    el.innerHTML = `
      <div class="fw-semibold small mb-2">${myReview ? 'Edit your review' : 'Write a review'}</div>
      <div class="row g-2 mb-2">
        <div class="col-sm-6">
          <input type="text" id="nfRevName" class="form-control form-control-sm" placeholder="Your name" value="${escapeHtml(myReview ? myReview.authorName : getSavedName())}">
        </div>
        <div class="col-sm-6 d-flex align-items-center" id="nfRevStarInput"></div>
      </div>
      <textarea id="nfRevComment" class="form-control form-control-sm mb-2" rows="2" placeholder="Share your experience with this property...">${escapeHtml(myReview ? myReview.comment : '')}</textarea>
      <div class="d-flex gap-2">
        <button class="btn btn-warning btn-sm fw-bold" id="nfRevSubmit">${myReview ? 'Update Review' : 'Submit Review'}</button>
        ${myReview ? '<button class="btn btn-outline-danger btn-sm" id="nfRevDelete">Delete My Review</button>' : ''}
      </div>
    `;

    const starInput = document.getElementById('nfRevStarInput');
    function paintStars() {
      starInput.innerHTML = [1, 2, 3, 4, 5].map(i =>
        `<i class="bi ${i <= selectedRating ? 'bi-star-fill' : 'bi-star'} nf-rev-star-input" data-star="${i}"></i>`
      ).join('');
      starInput.querySelectorAll('.nf-rev-star-input').forEach(starEl => {
        starEl.addEventListener('click', () => {
          selectedRating = Number(starEl.getAttribute('data-star'));
          paintStars();
        });
      });
    }
    paintStars();

    document.getElementById('nfRevSubmit').addEventListener('click', async () => {
      const name = document.getElementById('nfRevName').value.trim();
      const comment = document.getElementById('nfRevComment').value.trim();
      if (!name) { document.getElementById('nfRevName').focus(); return; }
      if (!selectedRating) { alert('Please select a star rating.'); return; }
      if (!comment) { document.getElementById('nfRevComment').focus(); return; }

      saveName(name);
      const now = Date.now();
      const reviewId = myReview ? myReview.id : reviewsRef(propertyId).push().key;
      await reviewsRef(propertyId).child(reviewId).set({
        authorId: myId,
        authorName: name,
        rating: selectedRating,
        comment,
        timestamp: myReview ? myReview.timestamp : now,
        updatedAt: now
      });
    });

    const delBtn = document.getElementById('nfRevDelete');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        if (!confirm('Delete your review? This can\'t be undone.')) return;
        await reviewsRef(propertyId).child(myReview.id).remove();
      });
    }
  }

  function renderList(propertyId, myId, list) {
    const el = document.getElementById('nfRevList');
    if (!el) return;
    if (!list.length) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = list.map(r => `
      <div class="nf-rev-item d-flex gap-2">
        <div class="nf-rev-avatar">${escapeHtml((r.authorName || '?').charAt(0).toUpperCase())}</div>
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-1">
            <span class="nf-rev-name">${escapeHtml(r.authorName)} ${r.authorId === myId ? '<span class="badge bg-warning text-dark ms-1" style="font-size:0.6rem;">You</span>' : ''}</span>
            <span class="nf-rev-date">${dateLabel(r.updatedAt || r.timestamp)}</span>
          </div>
          ${starsHtml(r.rating)}
          <div class="nf-rev-comment">${escapeHtml(r.comment)}</div>
        </div>
      </div>
    `).join('');
  }

  window.NestFinderReviews = { renderInto };
})();
