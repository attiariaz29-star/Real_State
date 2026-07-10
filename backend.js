/**
 * NESTFINDER AI — BACKEND.JS
 * localStorage-based backend for Auth, Properties, and Chat
 */

// ─────────────────────────────────────────────
// STORAGE KEYS
// ─────────────────────────────────────────────
const KEYS = {
  users: 'nestfinder_users',
  properties: 'nestfinder_properties',
  chats: 'nestfinder_chats',
  session: 'nestfinder_session',
};

// ─────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────
function uid() {
  return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
function now() { return new Date().toISOString(); }
function readKey(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}
function readKeyObj(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
}
function writeKey(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ─────────────────────────────────────────────
// AUTH SERVICE
// ─────────────────────────────────────────────
const AuthService = {
  getAll() { return readKey(KEYS.users); },

  getSession() {
    try { return JSON.parse(localStorage.getItem(KEYS.session)); } catch { return null; }
  },

  setSession(user) {
    localStorage.setItem(KEYS.session, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(KEYS.session);
  },

  register({ name, email, password, role }) {
    const users = this.getAll();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, msg: 'Email already registered. Please login.' };
    }
    const user = { id: uid(), name, email: email.toLowerCase(), password, role, createdAt: now() };
    users.push(user);
    writeKey(KEYS.users, users);
    this.setSession({ id: user.id, name: user.name, email: user.email, role: user.role });
    return { ok: true, user };
  },

  login({ email, password }) {
    const users = this.getAll();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return { ok: false, msg: 'Invalid email or password.' };
    this.setSession({ id: user.id, name: user.name, email: user.email, role: user.role });
    return { ok: true, user };
  },

  logout() {
    this.clearSession();
  },

  isLoggedIn() { return !!this.getSession(); },
  isSeller() { const s = this.getSession(); return s && s.role === 'Seller'; },
  isBuyer() { const s = this.getSession(); return s && s.role === 'Buyer'; },
};

// ─────────────────────────────────────────────
// PROPERTY SERVICE
// ─────────────────────────────────────────────
const PropertyService = {
  getAll() { return readKey(KEYS.properties); },

  getById(id) { return this.getAll().find(p => p.id === id) || null; },

  getBySeller(sellerId) { return this.getAll().filter(p => p.sellerId === sellerId); },

  search(query = '', filters = {}) {
    let props = this.getAll();
    if (query) {
      const q = query.toLowerCase();
      props = props.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.propertyType.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    if (filters.purpose) props = props.filter(p => p.purpose === filters.purpose);
    if (filters.city) props = props.filter(p => p.city === filters.city);
    if (filters.type) props = props.filter(p => p.propertyType === filters.type);
    if (filters.minPrice) props = props.filter(p => p.price >= Number(filters.minPrice));
    if (filters.maxPrice) props = props.filter(p => p.price <= Number(filters.maxPrice));
    if (filters.bedrooms) props = props.filter(p => p.bedrooms >= Number(filters.bedrooms));
    return props.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  post(data) {
    const session = AuthService.getSession();
    if (!session || session.role !== 'Seller') return { ok: false, msg: 'Only sellers can post properties.' };
    const props = this.getAll();
    const prop = {
      id: uid(),
      sellerId: session.id,
      sellerName: session.name,
      sellerEmail: session.email,
      title: data.title,
      propertyType: data.propertyType,
      purpose: data.purpose,
      city: data.city,
      areaName: data.areaName,
      location: `${data.areaName}, ${data.city}`,
      price: Number(data.price),
      priceDisplay: formatPrice(Number(data.price), data.purpose),
      bedrooms: Number(data.bedrooms),
      bathrooms: Number(data.bathrooms),
      areaSize: data.areaSize,
      description: data.description,
      features: data.features || [],
      image: data.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      carouselImages: data.carouselImages || [data.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'],
      status: 'active',
      createdAt: now(),
    };
    props.unshift(prop);
    writeKey(KEYS.properties, props);
    return { ok: true, prop };
  },

  delete(propId) {
    const session = AuthService.getSession();
    const props = this.getAll();
    const prop = props.find(p => p.id === propId);
    if (!prop) return { ok: false, msg: 'Property not found.' };
    if (prop.sellerId !== session?.id) return { ok: false, msg: 'Unauthorized.' };
    writeKey(KEYS.properties, props.filter(p => p.id !== propId));
    return { ok: true };
  },

  update(propId, data) {
    const session = AuthService.getSession();
    const props = this.getAll();
    const idx = props.findIndex(p => p.id === propId);
    if (idx === -1) return { ok: false, msg: 'Property not found.' };
    if (props[idx].sellerId !== session?.id) return { ok: false, msg: 'Unauthorized.' };
    props[idx] = { ...props[idx], ...data, updatedAt: now() };
    writeKey(KEYS.properties, props);
    return { ok: true, prop: props[idx] };
  },
};

// ─────────────────────────────────────────────
// CHAT SERVICE
// ─────────────────────────────────────────────
const ChatService = {
  // chatKey = propertyId + '::' + buyerId
  getChatKey(propertyId, buyerId) { return `${propertyId}::${buyerId}`; },

  getChat(propertyId, buyerId) {
    const all = readKeyObj(KEYS.chats);
    return all[this.getChatKey(propertyId, buyerId)] || [];
  },

  // Get all conversations for a property (for seller view)
  getAllChatsForProperty(propertyId) {
    const all = readKeyObj(KEYS.chats);
    const result = {};
    Object.keys(all).forEach(key => {
      if (key.startsWith(propertyId + '::')) {
        const buyerId = key.split('::')[1];
        result[buyerId] = all[key];
      }
    });
    return result;
  },

  // Get all chats where this buyer is involved
  getBuyerChats(buyerId) {
    const all = readKeyObj(KEYS.chats);
    const result = {};
    Object.keys(all).forEach(key => {
      if (key.endsWith('::' + buyerId)) {
        result[key] = all[key];
      }
    });
    return result;
  },

  sendMessage({ propertyId, senderId, senderName, senderRole, text }) {
    const all = readKeyObj(KEYS.chats);
    const session = AuthService.getSession();
    if (!session) return { ok: false, msg: 'Login required to send messages.' };

    // Determine buyerId
    let buyerId;
    if (senderRole === 'Buyer') {
      buyerId = senderId;
    } else {
      // Seller replying — need to find which buyer context
      buyerId = arguments[0].buyerId;
    }

    const key = this.getChatKey(propertyId, buyerId);
    if (!all[key]) all[key] = [];
    const msg = {
      id: uid(),
      senderId,
      senderName,
      senderRole,
      text: text.trim(),
      timestamp: now(),
    };
    all[key].push(msg);
    writeKey(KEYS.chats, all);
    return { ok: true, msg };
  },
};

// ─────────────────────────────────────────────
// PRICE FORMATTER
// ─────────────────────────────────────────────
function formatPrice(price, purpose) {
  if (purpose === 'Rent') {
    if (price >= 100000) return `PKR ${(price / 100000).toFixed(1)} Lakh/month`;
    return `PKR ${price.toLocaleString()}/month`;
  }
  if (price >= 10000000) return `PKR ${(price / 10000000).toFixed(2)} Crore`;
  if (price >= 100000) return `PKR ${(price / 100000).toFixed(0)} Lakh`;
  return `PKR ${price.toLocaleString()}`;
}

// ─────────────────────────────────────────────
// EXPOSE GLOBALS
// ─────────────────────────────────────────────
window.AuthService = AuthService;
window.PropertyService = PropertyService;
window.ChatService = ChatService;
window.formatPrice = formatPrice;

// Update nav based on session
function updateNavAuth() {
  const session = AuthService.getSession();
  const accLinks = document.querySelectorAll('a[href="acc.html"]');
  accLinks.forEach(link => {
    if (session) {
      link.textContent = session.name.split(' ')[0];
      link.style.color = '#f59e0b';
    }
  });
}

document.addEventListener('DOMContentLoaded', updateNavAuth);
