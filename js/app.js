// NestFinder Application Controller Logic

document.addEventListener("DOMContentLoaded", () => {
  // --- STATE ---
  let currentStep = 1;
  let uploadedImages = []; // Array of base64 data URLs
  let redirectAfterAuth = false; // Flag to direct user to post view after successful login
  const defaultPlaceholderImg = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80";

  // --- DOM ELEMENTS ---
  
  // Navigation & Views
  const navProperties = document.getElementById("nav-properties");
  const brandLink = document.getElementById("brand-link");
  const addPropertyBtn = document.getElementById("add-property-btn");
  const propertiesView = document.getElementById("properties-view");
  const postView = document.getElementById("post-view");
  const breadcrumbHome = document.getElementById("breadcrumb-home");
  
  // Auth Status Bar & Modal
  const authStatus = document.getElementById("auth-status");
  const authModalEl = document.getElementById("authModal");
  const authModal = new bootstrap.Modal(authModalEl);
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const authAlert = document.getElementById("auth-alert");
  
  // Properties View Controls
  const propertiesGrid = document.getElementById("properties-grid");
  const noPropertiesMsg = document.getElementById("no-properties-msg");
  const filterSearch = document.getElementById("filter-search");
  const filterType = document.getElementById("filter-type");
  const filterSort = document.getElementById("filter-sort");
  const resetFiltersBtn = document.getElementById("reset-filters-btn");
  
  // Multi-Step Form Controls
  const propertyForm = document.getElementById("property-form");
  const stepProgressLine = document.getElementById("step-progress-line");
  const stepNode1 = document.getElementById("step-node-1");
  const stepNode2 = document.getElementById("step-node-2");
  const stepNode3 = document.getElementById("step-node-3");
  
  const formStep1 = document.getElementById("form-step-1");
  const formStep2 = document.getElementById("form-step-2");
  const formStep3 = document.getElementById("form-step-3");
  
  const btnStep1Next = document.getElementById("btn-step1-next");
  const btnStep2Prev = document.getElementById("btn-step2-prev");
  const btnStep2Next = document.getElementById("btn-step2-next");
  const btnStep3Prev = document.getElementById("btn-step3-prev");
  const btnSubmitListing = document.getElementById("btn-submit-listing");
  
  // Form Inputs
  const inputTitle = document.getElementById("prop-title");
  const inputType = document.getElementById("prop-type");
  const inputPrice = document.getElementById("prop-price");
  const inputLocation = document.getElementById("prop-location");
  const inputDesc = document.getElementById("prop-desc");
  const uploadZone = document.getElementById("upload-zone");
  const imageInput = document.getElementById("image-input");
  const imagePreviews = document.getElementById("image-previews");
  const inputPhone = document.getElementById("prop-phone");
  const inputEmail = document.getElementById("prop-email");
  
  // Live Preview Cards Elements
  const previewBadge = document.getElementById("preview-badge");
  const previewImg = document.getElementById("preview-img");
  const previewPrice = document.getElementById("preview-price");
  const previewTitle = document.getElementById("preview-title");
  const previewLocation = document.getElementById("preview-location").querySelector("span");
  const previewDesc = document.getElementById("preview-desc");
  const previewPhone = document.getElementById("preview-phone");

  // --- INITIALIZATION ---
  updateAuthNavBar();
  renderProperties();
  resetPostForm();

  // --- VIEW ROUTING ---
  function showPropertiesView() {
    propertiesView.classList.add("active");
    postView.classList.remove("active");
    navProperties.classList.add("active");
    renderProperties();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showPostView() {
    propertiesView.classList.remove("active");
    postView.classList.add("active");
    navProperties.classList.remove("active");
    resetPostForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // Autofill contact info if user is logged in
    const currentUser = window.NestFinderDB.getCurrentUser();
    if (currentUser) {
      if (!inputEmail.value) inputEmail.value = currentUser.email;
      updateLivePreview();
    }
  }

  navProperties.addEventListener("click", (e) => {
    e.preventDefault();
    showPropertiesView();
  });

  brandLink.addEventListener("click", (e) => {
    e.preventDefault();
    showPropertiesView();
  });

  breadcrumbHome.addEventListener("click", (e) => {
    e.preventDefault();
    showPropertiesView();
  });

  addPropertyBtn.addEventListener("click", () => {
    const currentUser = window.NestFinderDB.getCurrentUser();
    if (!currentUser) {
      // Prompt Login Modal
      redirectAfterAuth = true;
      showAuthModal(true); // default to login
    } else {
      showPostView();
    }
  });

  // --- AUTHENTICATION FLOW ---
  function updateAuthNavBar() {
    const currentUser = window.NestFinderDB.getCurrentUser();
    if (currentUser) {
      authStatus.innerHTML = `
        <span class="d-inline-flex align-items-center gap-2">
          <i class="fa-solid fa-circle-user text-yellow"></i>
          Hi, <strong>${currentUser.name}</strong>
          <button id="logout-btn" class="btn btn-sm btn-link text-yellow p-0 ms-2 text-decoration-none" style="font-size: 0.85rem;">
            <i class="fa-solid fa-right-from-bracket"></i> Sign Out
          </button>
        </span>
      `;
      // Attach logout listener
      document.getElementById("logout-btn").addEventListener("click", () => {
        window.NestFinderDB.logoutUser();
        updateAuthNavBar();
        showPropertiesView();
      });
    } else {
      authStatus.innerHTML = `
        <a href="#" id="login-trigger-btn" class="text-secondary text-decoration-none">
          <i class="fa-solid fa-key me-1"></i> Sign In / Register
        </a>
      `;
      document.getElementById("login-trigger-btn").addEventListener("click", (e) => {
        e.preventDefault();
        redirectAfterAuth = false;
        showAuthModal(true);
      });
    }
  }

  function showAuthModal(isLogin = true) {
    authAlert.classList.add("d-none");
    if (isLogin) {
      tabLogin.classList.add("active");
      tabRegister.classList.remove("active");
      loginForm.classList.remove("d-none");
      registerForm.classList.add("d-none");
    } else {
      tabLogin.classList.remove("active");
      tabRegister.classList.add("active");
      loginForm.classList.add("d-none");
      registerForm.classList.remove("d-none");
    }
    authModal.show();
  }

  tabLogin.addEventListener("click", () => showAuthModal(true));
  tabRegister.addEventListener("click", () => showAuthModal(false));

  // Handle Login Form Submission
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    authAlert.classList.add("d-none");
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      window.NestFinderDB.loginUser(email, password);
      updateAuthNavBar();
      authModal.hide();
      loginForm.reset();
      
      if (redirectAfterAuth) {
        redirectAfterAuth = false;
        showPostView();
      }
    } catch (err) {
      authAlert.textContent = err.message;
      authAlert.classList.remove("d-none");
    }
  });

  // Handle Register Form Submission
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    authAlert.classList.add("d-none");
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const confirmPassword = document.getElementById("reg-password-confirm").value;

    if (password !== confirmPassword) {
      authAlert.textContent = "Passwords do not match.";
      authAlert.classList.remove("d-none");
      return;
    }

    try {
      window.NestFinderDB.registerUser(name, email, password);
      updateAuthNavBar();
      authModal.hide();
      registerForm.reset();

      if (redirectAfterAuth) {
        redirectAfterAuth = false;
        showPostView();
      }
    } catch (err) {
      authAlert.textContent = err.message;
      authAlert.classList.remove("d-none");
    }
  });

  // --- PROPERTIES VIEW LOGIC ---
  function renderProperties() {
    const searchVal = filterSearch.value.toLowerCase().trim();
    const typeVal = filterType.value;
    const sortVal = filterSort.value;

    let properties = window.NestFinderDB.getProperties();

    // 1. Search Filter
    if (searchVal) {
      properties = properties.filter(p => 
        p.title.toLowerCase().includes(searchVal) ||
        p.location.toLowerCase().includes(searchVal) ||
        p.description.toLowerCase().includes(searchVal)
      );
    }

    // 2. Property Type Filter
    if (typeVal !== "All") {
      properties = properties.filter(p => p.type === typeVal);
    }

    // 3. Sort Order
    if (sortVal === "price-asc") {
      properties.sort((a, b) => a.price - b.price);
    } else if (sortVal === "price-desc") {
      properties.sort((a, b) => b.price - a.price);
    } else {
      // Default: newest listed (descending by date or ID creation)
      properties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Render cards
    propertiesGrid.innerHTML = "";
    
    if (properties.length === 0) {
      noPropertiesMsg.classList.remove("d-none");
    } else {
      noPropertiesMsg.classList.add("d-none");
      
      properties.forEach(p => {
        const imageSrc = (p.images && p.images.length > 0) ? p.images[0] : defaultPlaceholderImg;
        const formattedPrice = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0
        }).format(p.price);

        const cardHTML = `
          <div class="col">
            <div class="nf-card">
              <div class="nf-card-img-wrapper">
                <span class="nf-card-badge">${p.type}</span>
                <img src="${imageSrc}" alt="${p.title}" class="nf-card-img">
              </div>
              <div class="nf-card-body">
                <div class="nf-card-price">${formattedPrice}</div>
                <h3 class="nf-card-title">${escapeHTML(p.title)}</h3>
                <div class="nf-card-location">
                  <i class="fa-solid fa-location-dot text-yellow"></i> <span>${escapeHTML(p.location)}</span>
                </div>
                <p class="text-secondary small mb-0 text-truncate-custom" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 3em;">
                  ${escapeHTML(p.description)}
                </p>
              </div>
              <div class="nf-card-footer">
                <div class="small text-secondary">
                  <i class="fa-solid fa-phone me-1"></i> ${escapeHTML(p.phone)}
                </div>
                <button class="btn-nf-primary py-1 px-3 fs-7 view-details-btn" data-id="${p.id}">
                  View Info
                </button>
              </div>
            </div>
          </div>
        `;
        propertiesGrid.insertAdjacentHTML("beforeend", cardHTML);
      });

      // Bind Details Viewers
      document.querySelectorAll(".view-details-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.target.getAttribute("data-id");
          const prop = window.NestFinderDB.getProperties().find(p => p.id === id);
          if (prop) {
            alert(`
Property: ${prop.title}
Type: ${prop.type}
Price: $${prop.price.toLocaleString()}
Location: ${prop.location}
Contact: ${prop.phone} | ${prop.email}

Description:
${prop.description}
            `);
          }
        });
      });
    }
  }

  // Filter Listeners
  filterSearch.addEventListener("keyup", renderProperties);
  filterType.addEventListener("change", renderProperties);
  filterSort.addEventListener("change", renderProperties);
  resetFiltersBtn.addEventListener("click", () => {
    filterSearch.value = "";
    filterType.value = "All";
    filterSort.value = "newest";
    renderProperties();
  });

  // --- MULTI-STEP PROPERTY POSTING FORM LOGIC ---
  
  function updateStepUI() {
    // Hide all steps
    formStep1.classList.remove("active");
    formStep2.classList.remove("active");
    formStep3.classList.remove("active");

    // Show current step
    document.getElementById(`form-step-${currentStep}`).classList.add("active");

    // Update Progress Indicators
    const totalSteps = 3;
    const progressWidth = ((currentStep - 1) / (totalSteps - 1)) * 100;
    stepProgressLine.style.width = `${progressWidth}%`;

    for (let i = 1; i <= totalSteps; i++) {
      const node = document.getElementById(`step-node-${i}`);
      if (i < currentStep) {
        node.classList.add("completed");
        node.classList.remove("active");
      } else if (i === currentStep) {
        node.classList.add("active");
        node.classList.remove("completed");
      } else {
        node.classList.remove("active", "completed");
      }
    }
  }

  function validateStep(step) {
    const fields = {
      1: [inputTitle, inputType, inputPrice, inputLocation],
      2: [inputDesc],
      3: [inputPhone, inputEmail]
    };

    let isValid = true;
    const currentFields = fields[step];

    currentFields.forEach(field => {
      if (!field.checkValidity()) {
        field.classList.add("is-invalid");
        isValid = false;
      } else {
        field.classList.remove("is-invalid");
        // Extra validations
        if (field === inputPrice && parseFloat(field.value) <= 0) {
          field.classList.add("is-invalid");
          isValid = false;
        }
        if (field === inputEmail && !validateEmail(field.value)) {
          field.classList.add("is-invalid");
          isValid = false;
        }
      }
    });

    return isValid;
  }

  // Next and Back Button Handlers
  btnStep1Next.addEventListener("click", () => {
    if (validateStep(1)) {
      currentStep = 2;
      updateStepUI();
    }
  });

  btnStep2Prev.addEventListener("click", () => {
    currentStep = 1;
    updateStepUI();
  });

  btnStep2Next.addEventListener("click", () => {
    if (validateStep(2)) {
      currentStep = 3;
      updateStepUI();
    }
  });

  btnStep3Prev.addEventListener("click", () => {
    currentStep = 2;
    updateStepUI();
  });

  // Attach real-time input validation removers
  [inputTitle, inputType, inputPrice, inputLocation, inputDesc, inputPhone, inputEmail].forEach(input => {
    input.addEventListener("input", () => {
      if (input.checkValidity()) {
        input.classList.remove("is-invalid");
      }
      updateLivePreview();
    });
  });

  inputType.addEventListener("change", () => {
    if (inputType.checkValidity()) {
      inputType.classList.remove("is-invalid");
    }
    updateLivePreview();
  });

  // --- LIVE PREVIEW LOGIC ---
  function updateLivePreview() {
    // 1. Title
    previewTitle.textContent = inputTitle.value.trim() || "Listing Title Will Appear Here";
    
    // 2. Type/Badge
    previewBadge.textContent = inputType.value || "Type";
    
    // 3. Price
    const priceVal = parseFloat(inputPrice.value);
    if (!isNaN(priceVal) && priceVal > 0) {
      previewPrice.textContent = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }).format(priceVal);
    } else {
      previewPrice.textContent = "$0";
    }

    // 4. Location
    previewLocation.textContent = inputLocation.value.trim() || "Location info";
    
    // 5. Description
    previewDesc.textContent = inputDesc.value.trim() || "Property description preview...";
    
    // 6. Contact Info
    previewPhone.textContent = inputPhone.value.trim() || "Contact Phone";

    // 7. Image
    if (uploadedImages.length > 0) {
      previewImg.src = uploadedImages[0];
    } else {
      previewImg.src = defaultPlaceholderImg;
    }
  }

  // --- FILE UPLOAD MANAGEMENT ---
  uploadZone.addEventListener("click", () => {
    imageInput.click();
  });

  uploadZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadZone.classList.add("dragover");
  });

  uploadZone.addEventListener("dragleave", () => {
    uploadZone.classList.remove("dragover");
  });

  uploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadZone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  });

  imageInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  });

  function processFiles(files) {
    const fileList = Array.from(files);
    fileList.forEach(file => {
      // Validations
      if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be smaller than 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Str = e.target.result;
        uploadedImages.push(base64Str);
        renderImagePreviews();
        updateLivePreview();
      };
      reader.readAsDataURL(file);
    });
  }

  function renderImagePreviews() {
    imagePreviews.innerHTML = "";
    uploadedImages.forEach((imgBase64, idx) => {
      const thumb = document.createElement("div");
      thumb.className = "image-preview-item";
      thumb.innerHTML = `
        <img src="${imgBase64}" alt="Preview ${idx + 1}">
        <button type="button" class="image-preview-remove" data-index="${idx}">&times;</button>
      `;
      imagePreviews.appendChild(thumb);
    });

    // Add removal listeners
    document.querySelectorAll(".image-preview-remove").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.getAttribute("data-index"));
        uploadedImages.splice(idx, 1);
        renderImagePreviews();
        updateLivePreview();
      });
    });
  }

  // --- SUBMIT COMPLETED FORM ---
  propertyForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!validateStep(3)) {
      return;
    }

    const newPropertyData = {
      title: inputTitle.value,
      type: inputType.value,
      price: inputPrice.value,
      location: inputLocation.value,
      description: inputDesc.value,
      phone: inputPhone.value,
      email: inputEmail.value,
      images: uploadedImages
    };

    try {
      window.NestFinderDB.addProperty(newPropertyData);
      
      // Success Notification / Alert
      showSubmitSuccessBanner();

      // Clear Form and State
      resetPostForm();
      showPropertiesView();
    } catch (err) {
      alert("Error submitting property: " + err.message);
    }
  });

  function resetPostForm() {
    propertyForm.reset();
    propertyForm.classList.remove("was-validated");
    uploadedImages = [];
    currentStep = 1;
    imagePreviews.innerHTML = "";
    
    // Clear inputs visual indicators
    [inputTitle, inputType, inputPrice, inputLocation, inputDesc, inputPhone, inputEmail].forEach(input => {
      input.classList.remove("is-invalid");
    });

    updateStepUI();
    updateLivePreview();
  }

  function showSubmitSuccessBanner() {
    const alertDiv = document.createElement("div");
    alertDiv.className = "alert alert-warning alert-dismissible fade show bg-yellow text-dark border-0 m-0 py-3 shadow-lg position-fixed start-50 translate-middle-x";
    alertDiv.style.top = "90px";
    alertDiv.style.zIndex = "1050";
    alertDiv.style.borderRadius = "12px";
    alertDiv.style.fontWeight = "600";
    alertDiv.innerHTML = `
      <div class="container d-flex align-items-center justify-content-between">
        <span><i class="fa-solid fa-circle-check me-2"></i> Property successfully posted! It is now listed below.</span>
        <button type="button" class="btn-close m-0 py-3 text-dark" data-bs-dismiss="alert" aria-label="Close" style="position:static;"></button>
      </div>
    `;
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alertDiv);
      bsAlert.close();
    }, 5000);
  }

  // --- HELPERS ---
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  }

  function escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
