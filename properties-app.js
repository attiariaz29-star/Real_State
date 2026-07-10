/**
 * NestFinder Properties Page Controller
 * Handles list rendering, multi-parameter filtering, modal details, and interactive CRUD views.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const API = window.NestFinderAPI;
  if (!API) {
    console.error("NestFinderAPI module not loaded.");
    return;
  }

  // ─── App State ───────────────────────────────────────────────────────────────
  let allProperties = [];
  let currentMode = "view"; // "view" or "manage"
  let activeDetailsModal = null;
  let activeCrudModal = null;
  let editingPropertyId = null; // Holds the ID of the property currently being edited

  // ─── DOM References ──────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  
  const gridContainer = $("propertiesGrid");
  const loadingOverlay = $("propertiesLoading");
  const emptyStateBox = $("emptyState");
  
  // Filter Inputs
  const searchInput = $("searchQuery");
  const selectType = $("filterType");
  const selectBedrooms = $("filterBedrooms");
  const selectBathrooms = $("filterBathrooms");
  const selectCategory = $("filterCategory");
  const selectBudget = $("filterBudget");
  const inputMinPrice = $("filterMinPrice");
  const inputMaxPrice = $("filterMaxPrice");
  const applyBtn = $("applyFiltersBtn");
  const resetFiltersBtn = $("resetFiltersBtn");
  
  // CRUD Actions
  const btnViewMode = $("btnViewMode");
  const btnManageMode = $("btnManageMode");
  const btnAddProperty = $("btnAddProperty");
  const btnResetDb = $("btnResetDb");
  
  // Forms & Modals
  const crudModalEl = $("crudPropertyModal");
  const crudForm = $("crudPropertyForm");
  const crudModalTitle = $("crudPropertyModalLabel");
  const detailModalEl = $("propDetailModal");

  // ─── Format Utilities ────────────────────────────────────────────────────────
  function formatPrice(n, category) {
    if (category === "For Rent" || category === "Rent") {
      return n >= 100000 
        ? "PKR " + (n / 100000).toFixed(1) + " Lakh/mo"
        : "PKR " + n.toLocaleString() + "/mo";
    } else {
      return n >= 10000000
        ? "PKR " + (n / 10000000).toFixed(2) + " Crore"
        : "PKR " + (n / 100000).toFixed(1) + " Lakh";
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }

  function renderSingleCard(p, matchScore, idx) {
    const cardCol = document.createElement("div");
    cardCol.className = "col-lg-4 col-md-6 animate-card";
    cardCol.style.animationDelay = ((idx % 6) * 0.05) + "s";
    
    const statusBadge = p.status !== "Active" 
      ? '<span class="prop-badge status-' + p.status.toLowerCase() + '">' + p.status + '</span>'
      : "";

    const crudOverlay = currentMode === "manage"
      ? '<div class="card-crud-overlay">' +
           '<button class="btn-crud-action edit" onclick="window.editProperty(' + p.id + ', event)" title="Edit Property">' +
             '<i class="bi bi-pencil-square"></i>' +
           '</button>' +
           '<button class="btn-crud-action delete" onclick="window.deleteProperty(' + p.id + ', event)" title="Delete Property">' +
             '<i class="bi bi-trash-fill"></i>' +
           '</button>' +
         '</div>'
      : "";

    const aiBadge = matchScore > 0
      ? '<div class="ai-match-badge" style="position:absolute;top:0.85rem;right:0.85rem;z-index:6;background:rgba(245,158,11,0.9);color:#000;border-radius:50px;padding:0.25rem 0.65rem;font-size:0.72rem;font-weight:700;backdrop-filter:blur(8px);box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;gap:0.25rem;"><i class="fa-solid fa-robot" style="font-size:0.65rem;"></i> AI ' + matchScore + '%</div>'
      : "";

    const bedSpec = p.bedrooms > 0 ? '<span><i class="bi bi-bed-fill"></i>' + p.bedrooms + ' Bed</span>' : "";
    const bathSpec = p.bathrooms > 0 ? '<span><i class="bi bi-water"></i>' + p.bathrooms + ' Bath</span>' : "";
    const areaSpec = p.area ? '<span><i class="bi bi-rulers"></i>' + p.area + '</span>' : "";

    cardCol.innerHTML =
      '<div class="ai-prop-card h-100 position-relative ' + (currentMode === 'manage' ? 'manage-mode' : '') + '" onclick="window.openDetails(' + p.id + ')">' +
        '<div class="ai-card-img-wrap">' +
          '<img src="' + (p.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80') + '" alt="' + escapeHtml(p.title) + '" class="prop-card-img" onerror="this.src=\'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80\'">' +
          '<div class="prop-card-badges">' +
            '<span class="prop-badge type">' + escapeHtml(p.type) + '</span>' +
            '<span class="prop-badge category">' + escapeHtml(p.category) + '</span>' +
            statusBadge +
          '</div>' +
          crudOverlay +
          aiBadge +
        '</div>' +
        '<div class="ai-card-body">' +
          '<div class="d-flex justify-content-between align-items-center mb-1">' +
            '<div class="ai-card-price">' + formatPrice(p.price, p.category) + '</div>' +
            '<span class="tier-pill badge rounded-pill" style="background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3)">' + escapeHtml(p.budgetCategory) + '</span>' +
          '</div>' +
          '<div class="ai-card-title">' + escapeHtml(p.title) + '</div>' +
          '<div class="ai-card-loc">' +
            '<i class="bi bi-geo-alt-fill text-yellow"></i> ' + escapeHtml(p.location) +
          '</div>' +
          '<div class="ai-card-specs">' +
            bedSpec + bathSpec + areaSpec +
          '</div>' +
          '<p class="text-secondary small mb-3 flex-grow-1" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5;">' +
            escapeHtml(p.description) +
          '</p>' +
          '<button class="btn btn-outline-warning btn-sm w-100 fw-bold mt-auto py-2">' +
            '<i class="bi bi-info-circle me-1"></i> View Details' +
          '</button>' +
        '</div>' +
      '</div>';
    gridContainer.appendChild(cardCol);
  }

  // ─── Database Sync ───────────────────────────────────────────────────────────
  async function loadData(showSpinner = true) {
    if (showSpinner) loadingOverlay.classList.remove("d-none");
    try {
      allProperties = await API.fetchAll();
      applyFilters();
    } catch (e) {
      console.error("Failed to load properties:", e);
      gridContainer.innerHTML = `<div class="col-12 text-center py-5 text-danger">Failed to load properties. Please try reloading the page.</div>`;
    } finally {
      if (showSpinner) {
        setTimeout(() => {
          loadingOverlay.classList.add("d-none");
        }, 300);
      }
    }
  }

  // ─── Render Properties ───────────────────────────────────────────────────────
  function computeMatchScore(p, query, type, beds, baths, category, budget, minPrice, maxPrice) {
    let score = 50;
    if (query) {
      const q = query.toLowerCase();
      if ((p.title || "").toLowerCase().includes(q)) score += 15;
      if ((p.location || "").toLowerCase().includes(q)) score += 10;
      if ((p.description || "").toLowerCase().includes(q)) score += 5;
    }
    if (type !== "all" && p.type === type) score += 8;
    if (beds !== "all") {
      const b = parseInt(beds, 10);
      if (beds === "10+" && p.bedrooms >= 10) score += 8;
      else if (beds !== "10+" && p.bedrooms === b) score += 8;
    }
    if (baths !== "all") {
      const ba = parseInt(baths, 10);
      if (baths === "10+" && p.bathrooms >= 10) score += 5;
      else if (baths !== "10+" && p.bathrooms === ba) score += 5;
    }
    if (category !== "all" && p.category === category) score += 5;
    if (budget !== "all" && p.budgetCategory === budget) score += 5;
    if (!isNaN(minPrice) && p.price >= minPrice) score += 3;
    if (!isNaN(maxPrice) && p.price <= maxPrice) score += 3;
    return Math.min(99, score);
  }

  function renderGrid(list) {
    const currentQuery = (searchInput.value || "").trim();
    const currentType = selectType.value;
    const currentBeds = selectBedrooms.value;
    const currentBaths = selectBathrooms.value;
    const currentCategory = selectCategory.value;
    const currentBudget = selectBudget.value;
    const currentMin = parseFloat(inputMinPrice.value);
    const currentMax = parseFloat(inputMaxPrice.value);

    gridContainer.innerHTML = "";
    
    if (list.length === 0) {
      // No results — try AI fallback: find closest properties
      if (currentQuery && allProperties.length > 0) {
        const scored = allProperties.map(p => ({
          p, score: computeMatchScore(p, currentQuery, currentType, currentBeds, currentBaths, currentCategory, currentBudget, currentMin, currentMax)
        }));
        scored.sort((a, b) => b.score - a.score);
        const closest = scored.slice(0, 3).filter(s => s.score > 30);
        if (closest.length > 0) {
          emptyStateBox.classList.add("d-none");
          const fallbackHeader = document.createElement("div");
          fallbackHeader.className = "col-12 text-center mb-4";
          fallbackHeader.innerHTML = '<div class="glass-card rounded-2xl p-4"><p class="text-yellow-300 mb-1 fw-bold"><i class="fa-solid fa-robot me-2"></i>No exact matches found for "' + escapeHtml(currentQuery) + '"</p><p class="text-gray-400 small mb-0">Here are the closest alternatives the AI recommends:</p></div>';
          gridContainer.appendChild(fallbackHeader);
          closest.forEach(function(item) {
            renderSingleCard(item.p, item.score);
          });
          return;
        }
      }
      emptyStateBox.classList.remove("d-none");
      return;
    }
    
    emptyStateBox.classList.add("d-none");

    list.forEach((p, idx) => {
      const matchScore = computeMatchScore(p, currentQuery, currentType, currentBeds, currentBaths, currentCategory, currentBudget, currentMin, currentMax);
      renderSingleCard(p, matchScore, idx);
    });
  }

  // ─── Filter Logic ────────────────────────────────────────────────────────────
  function applyFilters() {
    const q = (searchInput.value || "").trim().toLowerCase();
    const type = selectType.value;
    const beds = selectBedrooms.value;
    const baths = selectBathrooms.value;
    const category = selectCategory.value;
    const budget = selectBudget.value;
    const minPrice = parseFloat(inputMinPrice.value);
    const maxPrice = parseFloat(inputMaxPrice.value);

    const filtered = allProperties.filter(p => {
      // 1. Search Query
      if (q) {
        const titleMatch = p.title.toLowerCase().includes(q);
        const locMatch = p.location.toLowerCase().includes(q);
        const descMatch = p.description.toLowerCase().includes(q);
        if (!titleMatch && !locMatch && !descMatch) return false;
      }
      
      // 2. Type
      if (type !== "all" && p.type !== type) return false;
      
      // 3. Bedrooms
      if (beds !== "all") {
        if (beds === "10+") {
          if (p.bedrooms < 10) return false;
        } else {
          if (p.bedrooms !== parseInt(beds, 10)) return false;
        }
      }
      
      // 4. Bathrooms
      if (baths !== "all") {
        if (baths === "10+") {
          if (p.bathrooms < 10) return false;
        } else {
          if (p.bathrooms !== parseInt(baths, 10)) return false;
        }
      }
      
      // 5. Category (For Sale / Rent)
      if (category !== "all" && p.category !== category) return false;
      
      // 6. Budget Tier
      if (budget !== "all" && p.budgetCategory !== budget) return false;
      
      // 7. Price Min/Max
      if (!isNaN(minPrice) && p.price < minPrice) return false;
      if (!isNaN(maxPrice) && p.price > maxPrice) return false;
      
      return true;
    });

    renderGrid(filtered);
  }

  function resetFilters() {
    searchInput.value = "";
    selectType.value = "all";
    selectBedrooms.value = "all";
    selectBathrooms.value = "all";
    selectCategory.value = "all";
    selectBudget.value = "all";
    inputMinPrice.value = "";
    inputMaxPrice.value = "";
    applyFilters();
  }

  // ─── Setup Events ────────────────────────────────────────────────────────────
  applyBtn.addEventListener("click", () => {
    loadingOverlay.classList.remove("d-none");
    setTimeout(() => {
      applyFilters();
      loadingOverlay.classList.add("d-none");
    }, 400);
  });
  
  resetFiltersBtn.addEventListener("click", () => {
    loadingOverlay.classList.remove("d-none");
    setTimeout(() => {
      resetFilters();
      loadingOverlay.classList.add("d-none");
    }, 400);
  });

  // Enable search-as-you-type on the search box for dynamic responsiveness
  let searchTimeout = null;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      applyFilters();
    }, 300);
  });

  // ─── Mode Switching (Dashboard CRUD Mode) ────────────────────────────────────
  function setMode(mode) {
    currentMode = mode;
    if (mode === "manage") {
      btnManageMode.classList.add("active");
      btnViewMode.classList.remove("active");
      btnAddProperty.classList.remove("d-none");
    } else {
      btnViewMode.classList.add("active");
      btnManageMode.classList.remove("active");
      btnAddProperty.classList.add("d-none");
    }
    applyFilters();
  }

  btnViewMode.addEventListener("click", () => setMode("view"));
  btnManageMode.addEventListener("click", () => setMode("manage"));

  // ─── Modal Details View ──────────────────────────────────────────────────────
  window.openDetails = async function(id) {
    // If in manage mode, click handles details too unless clicked edit/delete
    const p = await API.getById(id);
    if (!p) return;

    const modalTitle = $("propDetailModalLabel");
    const modalBody = $("propDetailBody");

    modalTitle.textContent = p.title;

    // Build Image Gallery Slides
    const slidesHtml = p.images.map((img, idx) => `
      <div class="carousel-item ${idx === 0 ? 'active' : ''}">
        <div class="modal-gallery-wrap">
          <img src="${img}" class="modal-gallery-img" alt="${p.title}" onerror="this.src='https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'">
        </div>
      </div>
    `).join("");

    const indicatorsHtml = p.images.map((_, idx) => `
      <button type="button" data-bs-target="#modalGalleryCarousel" data-bs-slide-to="${idx}" class="${idx === 0 ? 'active' : ''}" aria-current="${idx === 0 ? 'true' : 'false'}" aria-label="Slide ${idx + 1}"></button>
    `).join("");

    const specBeds = p.bedrooms > 0 ? `
      <div class="col-4 col-md-3">
        <div class="spec-box">
          <i class="bi bi-bed-fill"></i>
          <div class="spec-box-val">${p.bedrooms}</div>
          <div class="spec-box-lbl">Bedrooms</div>
        </div>
      </div>` : "";

    const specBaths = p.bathrooms > 0 ? `
      <div class="col-4 col-md-3">
        <div class="spec-box">
          <i class="bi bi-water"></i>
          <div class="spec-box-val">${p.bathrooms}</div>
          <div class="spec-box-lbl">Bathrooms</div>
        </div>
      </div>` : "";

    const specArea = p.area ? `
      <div class="col-4 col-md-3">
        <div class="spec-box">
          <i class="bi bi-rulers"></i>
          <div class="spec-box-val">${p.area}</div>
          <div class="spec-box-lbl">Area Size</div>
        </div>
      </div>` : "";

    const specType = `
      <div class="col-4 col-md-3">
        <div class="spec-box">
          <i class="bi bi-house-door-fill"></i>
          <div class="spec-box-val">${p.type}</div>
          <div class="spec-box-lbl">Property Type</div>
        </div>
      </div>`;

    const featuresHtml = p.features.map(f => `<span class="feature-badge"><i class="bi bi-check2-circle text-yellow me-1"></i>${f}</span>`).join("");

    modalBody.innerHTML = `
      <div class="row g-4">
        <!-- Gallery Slider -->
        <div class="col-lg-7">
          <div id="modalGalleryCarousel" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-indicators">
              ${indicatorsHtml}
            </div>
            <div class="carousel-inner">
              ${slidesHtml}
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#modalGalleryCarousel" data-bs-slide="prev">
              <span class="carousel-control-prev-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#modalGalleryCarousel" data-bs-slide="next">
              <span class="carousel-control-next-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Next</span>
            </button>
          </div>
        </div>
        
        <!-- Quick Specs -->
        <div class="col-lg-5">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="badge bg-warning text-dark px-3 py-2 fw-bold fs-6">${p.category}</span>
            <span class="badge bg-dark border border-warning text-warning px-3 py-2 fw-bold fs-6">${p.budgetCategory}</span>
          </div>
          
          <h3 class="fs-4 fw-bold text-yellow mb-3">${formatPrice(p.price, p.category)}</h3>
          
          <div class="text-secondary small mb-3">
            <i class="bi bi-geo-alt-fill text-danger me-1"></i> ${p.location}
          </div>
          
          <div class="row g-2 mb-4">
            ${specBeds}
            ${specBaths}
            ${specArea}
            ${specType}
          </div>

          <h5 class="fs-6 fw-bold mb-2">Property Features</h5>
          <div class="d-flex flex-wrap gap-2 mb-4">
            ${featuresHtml || '<span class="text-muted small">No special features listed</span>'}
          </div>
        </div>

        <!-- Full Description -->
        <div class="col-12 mt-2">
          <h5 class="fs-6 fw-bold mb-2">Description</h5>
          <p style="line-height:1.7; font-size:0.92rem; text-align:justify;">${p.description}</p>
        </div>

        <!-- Contact details -->
        <div class="col-12 mt-2 border-top pt-4">
          <h5 class="fs-6 fw-bold mb-3">Contact Information</h5>
          <div class="agent-card">
            <div class="agent-avatar">
              ${p.contactInfo.name.charAt(0)}
            </div>
            <div>
              <div class="agent-name">${p.contactInfo.name}</div>
              <div class="agent-role">NestFinder Certified Partner Agent</div>
              <div class="mt-2 d-flex flex-wrap gap-3 small">
                <span><i class="bi bi-telephone-fill text-yellow me-1"></i>${p.contactInfo.phone}</span>
                <span><i class="bi bi-envelope-fill text-yellow me-1"></i>${p.contactInfo.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (!activeDetailsModal) {
      activeDetailsModal = new bootstrap.Modal(detailModalEl);
    }
    activeDetailsModal.show();
  };

  // ─── CRUD Action: Add / Edit Property Modal ──────────────────────────────────
  btnAddProperty.addEventListener("click", () => {
    editingPropertyId = null;
    crudModalTitle.textContent = "Add Property Listing";
    crudForm.reset();
    
    // Set some defaults
    $("propContactName").value = "Zubair Ahmed";
    $("propContactPhone").value = "+92 300 1234567";
    $("propContactEmail").value = "zubair@nestfinder.ai";

    if (!activeCrudModal) {
      activeCrudModal = new bootstrap.Modal(crudModalEl);
    }
    activeCrudModal.show();
  });

  window.editProperty = async function(id, event) {
    if (event) event.stopPropagation(); // Stop details modal from opening

    editingPropertyId = id;
    crudModalTitle.textContent = "Edit Property Listing";
    
    const p = await API.getById(id);
    if (!p) return;

    // Fill form
    $("propTitle").value = p.title;
    $("propType").value = p.type;
    $("propCategory").value = p.category;
    $("propBudgetCategory").value = p.budgetCategory;
    $("propPrice").value = p.price;
    $("propLocation").value = p.location;
    $("propBedrooms").value = p.bedrooms;
    $("propBathrooms").value = p.bathrooms;
    $("propArea").value = p.area;
    $("propDescription").value = p.description;
    $("propImage").value = p.image;
    $("propFeatures").value = p.features.join(", ");
    $("propContactName").value = p.contactInfo.name;
    $("propContactPhone").value = p.contactInfo.phone;
    $("propContactEmail").value = p.contactInfo.email;
    $("propStatus").value = p.status;

    if (!activeCrudModal) {
      activeCrudModal = new bootstrap.Modal(crudModalEl);
    }
    activeCrudModal.show();
  };

  // ─── CRUD Form Submit ────────────────────────────────────────────────────────
  crudForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const featuresArr = $("propFeatures").value
      ? $("propFeatures").value.split(",").map(f => f.trim()).filter(f => f !== "")
      : [];

    const formData = {
      title: $("propTitle").value,
      type: $("propType").value,
      category: $("propCategory").value,
      budgetCategory: $("propBudgetCategory").value,
      price: parseFloat($("propPrice").value),
      location: $("propLocation").value,
      bedrooms: parseInt($("propBedrooms").value, 10) || 0,
      bathrooms: parseInt($("propBathrooms").value, 10) || 0,
      area: $("propArea").value,
      description: $("propDescription").value,
      image: $("propImage").value || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      images: [
        $("propImage").value || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80",
        "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80"
      ],
      features: featuresArr,
      contactInfo: {
        name: $("propContactName").value || "Zubair Ahmed",
        phone: $("propContactPhone").value || "+92 300 1234567",
        email: $("propContactEmail").value || "zubair@nestfinder.ai"
      },
      status: $("propStatus").value || "Active"
    };

    loadingOverlay.classList.remove("d-none");
    try {
      if (editingPropertyId) {
        // Edit existing
        await API.update(editingPropertyId, formData);
        showToast("Property updated successfully!");
      } else {
        // Create new
        await API.create(formData);
        showToast("Property listing created successfully!");
      }
      activeCrudModal.hide();
      await loadData(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save property listing.");
    } finally {
      loadingOverlay.classList.add("d-none");
    }
  });

  // ─── CRUD Action: Delete Property ────────────────────────────────────────────
  window.deleteProperty = async function(id, event) {
    if (event) event.stopPropagation(); // Stop details modal

    if (confirm("Are you sure you want to delete this property listing?")) {
      loadingOverlay.classList.remove("d-none");
      try {
        const deleted = await API.delete(id);
        if (deleted) {
          showToast("Property deleted successfully.");
          await loadData(false);
        } else {
          alert("Failed to delete property.");
        }
      } catch (e) {
        console.error(e);
        alert("An error occurred during deletion.");
      } finally {
        loadingOverlay.classList.add("d-none");
      }
    }
  };

  // ─── CRUD Action: Reset Database ─────────────────────────────────────────────
  btnResetDb.addEventListener("click", async () => {
    if (confirm("Are you sure you want to reset the database? All custom modifications will be deleted.")) {
      loadingOverlay.classList.remove("d-none");
      try {
        await API.reset();
        showToast("Database restored to default 50 properties.");
        await loadData(false);
      } catch (e) {
        console.error(e);
        alert("Failed to reset database.");
      } finally {
        loadingOverlay.classList.add("d-none");
      }
    }
  });

  // ─── Toast Feedback Notification ─────────────────────────────────────────────
  function showToast(message) {
    const toastEl = document.createElement("div");
    toastEl.style.position = "fixed";
    toastEl.style.bottom = "24px";
    toastEl.style.right = "24px";
    toastEl.style.backgroundColor = "#f59e0b";
    toastEl.style.color = "#000000";
    toastEl.style.padding = "12px 24px";
    toastEl.style.borderRadius = "8px";
    toastEl.style.fontWeight = "700";
    toastEl.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
    toastEl.style.zIndex = "9999";
    toastEl.style.animation = "fadeInUp 0.3s ease-out";
    toastEl.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i> ${message}`;
    
    document.body.appendChild(toastEl);
    
    setTimeout(() => {
      toastEl.style.animation = "fadeInUp 0.3s ease-out reverse";
      setTimeout(() => {
        toastEl.remove();
      }, 300);
    }, 3000);
  }

  // ─── URL Search Params ────────────────────────────────────────────────────────
  function applyURLParams() {
    const params = new URLSearchParams(window.location.search);
    const searchTerm = params.get("search");
    if (searchTerm) searchInput.value = searchTerm;
    const typeParam = params.get("type");
    if (typeParam && typeParam !== "all") { selectType.value = typeParam; }
    const categoryParam = params.get("category");
    if (categoryParam && categoryParam !== "all") { selectCategory.value = categoryParam; }
    const budgetParam = params.get("budget");
    if (budgetParam && budgetParam !== "all") { selectBudget.value = budgetParam; }
    const bedsParam = params.get("beds");
    if (bedsParam && bedsParam !== "all") { selectBedrooms.value = bedsParam; }
    const bathsParam = params.get("baths");
    if (bathsParam && bathsParam !== "all") { selectBathrooms.value = bathsParam; }
    const minPriceParam = params.get("minPrice");
    if (minPriceParam) { inputMinPrice.value = minPriceParam; }
    const maxPriceParam = params.get("maxPrice");
    if (maxPriceParam) { inputMaxPrice.value = maxPriceParam; }
    const keywordsParam = params.get("keywords");
    if (keywordsParam && !searchTerm) { searchInput.value = keywordsParam; }
  }

  // ─── Init App ────────────────────────────────────────────────────────────────
  applyURLParams();
  await loadData();
});
