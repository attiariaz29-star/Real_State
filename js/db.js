// NestFinder Local Database Management (localStorage wrapper)

const SEED_PROPERTIES = [
  {
    id: "prop-1",
    userId: "user-seed-1",
    title: "Luxury Modern Villa with Infinity Pool",
    type: "Villa",
    price: 1250000,
    location: "Beverly Hills, Los Angeles, CA",
    description: "Experience luxury living in this architectural masterpiece. Featuring 5 bedrooms, 6 bathrooms, a state-of-the-art home theater, infinity-edge swimming pool, and panoramic city views. Fully smart-home integrated with premium finishes throughout.",
    phone: "+1 (555) 019-2834",
    email: "listings@nestfinder.com",
    images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80"],
    createdAt: new Date("2026-05-10").toISOString()
  },
  {
    id: "prop-2",
    userId: "user-seed-2",
    title: "Minimalist Loft in Downtown Core",
    type: "Apartment",
    price: 450000,
    location: "Tribeca, New York, NY",
    description: "Stunning industrial loft in the heart of Tribeca. Exposed brick walls, double-height ceilings, and massive factory windows that bathe the open space in natural light. Perfect for urban professionals desiring space and style.",
    phone: "+1 (555) 014-9988",
    email: "tribeca.rentals@nestfinder.com",
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"],
    createdAt: new Date("2026-06-01").toISOString()
  },
  {
    id: "prop-3",
    userId: "user-seed-1",
    title: "Charming Craftsman House with Garden",
    type: "House",
    price: 680000,
    location: "Portland, OR",
    description: "Beautifully restored 1920s Craftsman home. Impeccable woodwork, cozy fireplace, updated chef's kitchen, and a private backyard garden oasis. Situated in a highly walkable neighborhood close to parks and local cafes.",
    phone: "+1 (555) 012-3456",
    email: "portland.living@nestfinder.com",
    images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80"],
    createdAt: new Date("2026-06-15").toISOString()
  }
];

const SEED_USERS = [
  {
    id: "user-seed-1",
    name: "John Doe",
    email: "john@example.com",
    password: "password123" // Plain text for mock auth simplicity
  },
  {
    id: "user-seed-2",
    name: "Jane Smith",
    email: "jane@example.com",
    password: "password123"
  }
];

class NestFinderDatabase {
  constructor() {
    this._initDB();
  }

  _initDB() {
    if (!localStorage.getItem("nf_users")) {
      localStorage.setItem("nf_users", JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem("nf_properties")) {
      localStorage.setItem("nf_properties", JSON.stringify(SEED_PROPERTIES));
    }
  }

  // --- USER API ---
  getUsers() {
    return JSON.parse(localStorage.getItem("nf_users")) || [];
  }

  getCurrentUser() {
    const userJson = localStorage.getItem("nf_current_user");
    return userJson ? JSON.parse(userJson) : null;
  }

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem("nf_current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("nf_current_user");
    }
  }

  registerUser(name, email, password) {
    const users = this.getUsers();
    const normalizedEmail = email.toLowerCase().trim();

    if (users.some(u => u.email === normalizedEmail)) {
      throw new Error("An account with this email already exists.");
    }

    const newUser = {
      id: "user-" + Date.now(),
      name: name.trim(),
      email: normalizedEmail,
      password: password
    };

    users.push(newUser);
    localStorage.setItem("nf_users", JSON.stringify(users));
    this.setCurrentUser(newUser);
    return newUser;
  }

  loginUser(email, password) {
    const users = this.getUsers();
    const normalizedEmail = email.toLowerCase().trim();
    
    const user = users.find(u => u.email === normalizedEmail && u.password === password);
    if (!user) {
      throw new Error("Invalid email or password.");
    }

    this.setCurrentUser(user);
    return user;
  }

  logoutUser() {
    this.setCurrentUser(null);
  }

  // --- PROPERTY API ---
  getProperties() {
    return JSON.parse(localStorage.getItem("nf_properties")) || [];
  }

  addProperty(propertyData) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error("You must be logged in to post a property.");
    }

    const properties = this.getProperties();
    const newProperty = {
      id: "prop-" + Date.now(),
      userId: currentUser.id,
      title: propertyData.title.trim(),
      type: propertyData.type,
      price: parseFloat(propertyData.price),
      location: propertyData.location.trim(),
      description: propertyData.description.trim(),
      phone: propertyData.phone.trim(),
      email: propertyData.email.trim(),
      images: propertyData.images || [], // base64 strings or URLs
      createdAt: new Date().toISOString()
    };

    properties.unshift(newProperty); // Newest first
    localStorage.setItem("nf_properties", JSON.stringify(properties));
    return newProperty;
  }
}

// Instantiate globally
window.NestFinderDB = new NestFinderDatabase();
