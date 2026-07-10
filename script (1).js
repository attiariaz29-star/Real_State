// ============================================
// CONNECT DESK - SHARED JAVASCRIPT
// Only Dropdown + Forms + FAQ. No Navbar/Footer logic.
// ============================================

// ============================================
// FAQ DATA (12 Real Estate FAQs)
// ============================================
const faqData = [
    {
        question: "How do I buy a house through your agency?",
        answer: "Buying a house is simple. Browse our listings, schedule a visit to properties you're interested in, and work with our expert agents who will guide you through the entire process from offer to closing. We handle all paperwork and negotiations on your behalf."
    },
    {
        question: "How does property renting work?",
        answer: "To rent a property, browse our rental listings, schedule a viewing, and submit an application. Our team will verify your credentials and prepare the lease agreement. Most rentals require first month's rent and a security deposit upfront."
    },
    {
        question: "What is the difference between premium and budget homes?",
        answer: "Premium homes feature luxury amenities such as smart home technology, high-end finishes, prime locations, and exclusive facilities. Budget homes offer comfortable living at affordable prices with essential amenities, perfect for first-time buyers or renters."
    },
    {
        question: "Do you offer verified listings?",
        answer: "Yes, all our listings are thoroughly verified. We conduct physical inspections, verify ownership documents, and ensure all properties meet legal requirements. Each listing includes accurate photos, descriptions, and pricing information."
    },
    {
        question: "Can I schedule a property visit?",
        answer: "Absolutely! You can schedule a visit through our Connect Page or by calling our office directly. We offer flexible viewing times including weekends. Virtual tours are also available for select properties."
    },
    {
        question: "How is property pricing determined?",
        answer: "Property pricing is based on location, size, amenities, market conditions, and comparable sales in the area. Our expert appraisers evaluate each property to ensure fair and competitive pricing."
    },
    {
        question: "Is there any commission fee?",
        answer: "For buyers, our services are typically free as the seller pays the commission. For sellers, we charge a competitive commission rate based on the property value. Contact us for specific details."
    },
    {
        question: "What documents do I need to buy a property?",
        answer: "You'll need a valid ID, proof of income or funds, bank statements, and tax returns. For mortgages, pre-approval letters are required. Our agents will provide a complete checklist tailored to your transaction."
    },
    {
        question: "Can I negotiate the price?",
        answer: "Yes, price negotiation is a standard part of real estate transactions. Our experienced agents will help you craft competitive offers and negotiate on your behalf to get the best possible deal."
    },
    {
        question: "Do you help with mortgage financing?",
        answer: "We partner with several trusted mortgage lenders and financial institutions. Our team can connect you with the right lender and help you understand different loan options."
    },
    {
        question: "What is your refund or cancellation policy?",
        answer: "For rentals, deposits are refundable if cancellation occurs within the agreed timeframe. For purchases, earnest money deposits are handled according to the purchase contract terms. We ensure transparent policies are explained before any commitment."
    },
    {
        question: "How long does the buying process take?",
        answer: "Cash purchases can close in 2-4 weeks, while mortgage purchases typically take 30-60 days. Factors include financing approval, inspections, appraisals, and title searches. Our agents keep you informed at every step."
    }
];

// ============================================
// STATE
// ============================================
let feedbackList = JSON.parse(localStorage.getItem('connectDeskFeedback')) || [];
let currentRating = 0;

// ============================================
// DOM
// ============================================
const connectDeskBtn = document.getElementById('connectDeskBtn');
const connectDeskDropdown = document.getElementById('connectDeskDropdown');
const toastContainer = document.getElementById('toastContainer');

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    setupDropdown();
    setupKeyboard();

    const page = window.location.pathname.split('/').pop() || 'connect.html';

    if (page === 'connect.html' || page === '') {
        setupConnectForm();
    }

    if (page === 'feedback.html') {
        setupStarRating();
        setupFeedbackForm();
        renderFeedbackList();
    }

    if (page === 'faq.html') {
        renderFAQ();
        setupFAQSearch();
    }

    highlightActiveDropdown(page);
});

// ============================================
// DROPDOWN
// ============================================
function setupDropdown() {
    if (!connectDeskBtn || !connectDeskDropdown) return;

    connectDeskBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        connectDeskDropdown.classList.toggle('show');
        connectDeskBtn.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!connectDeskBtn.contains(e.target) && !connectDeskDropdown.contains(e.target)) {
            connectDeskDropdown.classList.remove('show');
            connectDeskBtn.classList.remove('active');
        }
    });
}

function highlightActiveDropdown(page) {
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === page) {
            item.classList.add('active');
        }
    });
}

function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (connectDeskDropdown) connectDeskDropdown.classList.remove('show');
            if (connectDeskBtn) connectDeskBtn.classList.remove('active');
        }
    });
}

// ============================================
// TOAST
// ============================================
function showToast(message, type = 'success') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    if (type === 'info') icon = 'fa-info-circle';

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'toastOut 0.4s ease forwards';
            setTimeout(() => toast.remove(), 400);
        }
    }, 4000);
}

// ============================================
// CONNECT FORM
// ============================================
function setupConnectForm() {
    const form = document.getElementById('connectForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('connectName').value;

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;

        setTimeout(() => {
            showToast(`Thank you ${name}! Your message has been sent.`, 'success');
            form.reset();
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 1500);
    });
}

// ============================================
// STAR RATING
// ============================================
function setupStarRating() {
    const starRating = document.getElementById('starRating');
    if (!starRating) return;

    const stars = starRating.querySelectorAll('.star');
    const ratingText = document.getElementById('ratingText');
    const ratingInput = document.getElementById('feedbackRating');

    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            currentRating = index + 1;
            if (ratingInput) ratingInput.value = currentRating;
            updateStars(currentRating);

            const labels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
            if (ratingText) {
                ratingText.textContent = labels[index];
                ratingText.style.color = 'var(--gold)';
            }
        });

        star.addEventListener('mouseenter', () => {
            updateStars(index + 1, true);
        });
    });

    starRating.addEventListener('mouseleave', () => {
        updateStars(currentRating);
    });
}

function updateStars(rating, isHover = false) {
    const starRating = document.getElementById('starRating');
    if (!starRating) return;

    const stars = starRating.querySelectorAll('.star');
    stars.forEach((star, index) => {
        const icon = star.querySelector('i');
        if (index < rating) {
            star.classList.add('active');
            icon.classList.remove('far');
            icon.classList.add('fas');
        } else {
            star.classList.remove('active');
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
    });
}

function resetStarRating() {
    currentRating = 0;
    const ratingInput = document.getElementById('feedbackRating');
    const ratingText = document.getElementById('ratingText');
    if (ratingInput) ratingInput.value = 0;
    if (ratingText) {
        ratingText.textContent = 'Click stars to rate';
        ratingText.style.color = 'var(--gray)';
    }
    updateStars(0);
}

// ============================================
// FEEDBACK FORM
// ============================================
function setupFeedbackForm() {
    const form = document.getElementById('feedbackForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('feedbackName').value;
        const message = document.getElementById('feedbackMessage').value;

        if (currentRating === 0) {
            showToast('Please select a star rating before submitting.', 'warning');
            return;
        }

        const feedback = {
            id: Date.now(),
            name: name,
            rating: currentRating,
            message: message,
            date: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            })
        };

        feedbackList.unshift(feedback);
        localStorage.setItem('connectDeskFeedback', JSON.stringify(feedbackList));

        showToast('Thank you for your feedback! Your review has been saved.', 'success');

        form.reset();
        resetStarRating();
        renderFeedbackList();
    });
}

function renderFeedbackList() {
    const list = document.getElementById('feedbackList');
    const count = document.getElementById('feedbackCount');
    const empty = document.getElementById('feedbackEmpty');

    if (!list || !count || !empty) return;

    list.innerHTML = '';

    if (feedbackList.length === 0) {
        empty.classList.add('show');
        count.textContent = '0 reviews';
        return;
    }

    empty.classList.remove('show');
    count.textContent = `${feedbackList.length} review${feedbackList.length !== 1 ? 's' : ''}`;

    feedbackList.forEach(item => {
        const feedbackItem = document.createElement('div');
        feedbackItem.className = 'feedback-item';

        const stars = Array(5).fill(0).map((_, i) => 
            `<i class="fas fa-star" style="color: ${i < item.rating ? 'var(--gold)' : 'var(--gray-light)'}; font-size: 0.75rem;"></i>`
        ).join('');

        feedbackItem.innerHTML = `
            <div class="feedback-item-header">
                <span class="feedback-item-name">${item.name}</span>
                <span class="feedback-item-rating">${stars}</span>
            </div>
            <p class="feedback-item-message">${item.message}</p>
            <div class="feedback-item-date">${item.date}</div>
        `;

        list.appendChild(feedbackItem);
    });
}

// ============================================
// FAQ
// ============================================
function renderFAQ() {
    const container = document.getElementById('faqContainer');
    if (!container) return;

    container.innerHTML = '';

    faqData.forEach((item, index) => {
        const faqItem = document.createElement('div');
        faqItem.className = 'faq-item';
        faqItem.dataset.question = item.question.toLowerCase();
        faqItem.innerHTML = `
            <button class="faq-question" onclick="toggleFAQ(${index})">
                <span>${item.question}</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="faq-answer">
                <p>${item.answer}</p>
            </div>
        `;
        container.appendChild(faqItem);
    });
}

function toggleFAQ(index) {
    const container = document.getElementById('faqContainer');
    if (!container) return;

    const items = container.querySelectorAll('.faq-item');
    items.forEach((item, i) => {
        if (i === index) {
            item.classList.toggle('open');
        } else {
            item.classList.remove('open');
        }
    });
}

function setupFAQSearch() {
    const searchInput = document.getElementById('faqSearch');
    const noResults = document.getElementById('faqNoResults');
    const container = document.getElementById('faqContainer');

    if (!searchInput || !container) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const items = container.querySelectorAll('.faq-item');
        let visibleCount = 0;

        items.forEach(item => {
            const question = item.dataset.question;
            if (question.includes(query)) {
                item.style.display = 'block';
                visibleCount++;
            } else {
                item.style.display = 'none';
                item.classList.remove('open');
            }
        });

        if (noResults) {
            noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    });
}