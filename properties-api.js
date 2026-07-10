/**
 * NestFinder Properties API Manager
 * Simulated backend API for CRUD operations on property listings.
 * Backed by localStorage with fallback/init from properties.json and embedded JS data.
 */

const NestFinderAPI = (function() {
  const LOCAL_STORAGE_KEY = "nestfinder_db_properties";
  const JSON_DATA_PATH = "properties.json";

  // Embedded default 50 properties fallback in case fetch is blocked by CORS/file://
  const DEFAULT_PROPERTIES = [
    {
        "id":  1,
        "budgetCategory":  "Premium",
        "type":  "Apartment",
        "title":  "Premium 2 Bed Apartment in Gulberg III",
        "location":  "Gulberg III, Lahore",
        "priceDisplay":  "PKR 6 Crore",
        "area":  "1200 sq ft",
        "bathrooms":  1,
        "images":  [
                       "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\u0026q=80"
                   ],
        "price":  60000000,
        "bedrooms":  2,
        "features":  [
                         "Backup Generator",
                         "High-speed Internet",
                         "Gym Access"
                     ],
        "description":  "This beautiful premium Apartment is ideally located in the heart of Gulberg III, Lahore. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-19T10:00:00Z",
        "contactInfo":  {
                            "email":  "ayesha.k@nestfinder.ai",
                            "name":  "Ayesha Khan",
                            "phone":  "+92 321 9876543"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800\u0026q=80"
    },
    {
        "id":  2,
        "budgetCategory":  "Budget",
        "type":  "Villa",
        "title":  "Budget 3 Bed Villa in G-11 Sector",
        "location":  "G-11 Sector, Islamabad",
        "priceDisplay":  "PKR 45,000/mo",
        "area":  "500 sq yards",
        "bathrooms":  3,
        "images":  [
                       "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800\u0026q=80"
                   ],
        "price":  45000,
        "bedrooms":  3,
        "features":  [
                         "Gas Connection",
                         "Elevator",
                         "Servant Quarter"
                     ],
        "description":  "This beautiful budget Villa is ideally located in the heart of G-11 Sector, Islamabad. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-18T10:00:00Z",
        "contactInfo":  {
                            "email":  "bilal@nestfinder.ai",
                            "name":  "Bilal Siddiqui",
                            "phone":  "+92 333 5558899"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800\u0026q=80"
    },
    {
        "id":  3,
        "budgetCategory":  "Luxury",
        "type":  "Plot",
        "title":  "Luxury Plot in PECHS Block 2",
        "location":  "PECHS Block 2, Karachi",
        "priceDisplay":  "PKR 50 Crore",
        "area":  "1 Kanal",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800\u0026q=80"
                   ],
        "price":  500000000,
        "bedrooms":  0,
        "features":  [
                         "Water Supply",
                         "Terrace",
                         "Parking Garage"
                     ],
        "description":  "This beautiful luxury Plot is ideally located in the heart of PECHS Block 2, Karachi. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-17T10:00:00Z",
        "contactInfo":  {
                            "email":  "maria@nestfinder.ai",
                            "name":  "Maria Yousuf",
                            "phone":  "+92 315 2223344"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800\u0026q=80"
    },
    {
        "id":  4,
        "budgetCategory":  "Premium",
        "type":  "Commercial",
        "title":  "Premium Commercial in Cavalry Ground",
        "location":  "Cavalry Ground, Lahore",
        "priceDisplay":  "PKR 1.2 Lakh/mo",
        "area":  "3600 sq ft",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\u0026q=80"
                   ],
        "price":  120000,
        "bedrooms":  0,
        "features":  [
                         "High-speed Internet",
                         "Swimming Pool",
                         "Lush Lawn"
                     ],
        "description":  "This beautiful premium Commercial is ideally located in the heart of Cavalry Ground, Lahore. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-16T10:00:00Z",
        "contactInfo":  {
                            "email":  "zubair@nestfinder.ai",
                            "name":  "Zubair Ahmed",
                            "phone":  "+92 300 1234567"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800\u0026q=80"
    },
    {
        "id":  5,
        "budgetCategory":  "Budget",
        "type":  "Penthouse",
        "title":  "Budget 1 Bed Penthouse in Bahria Town Phase 4",
        "location":  "Bahria Town Phase 4, Islamabad",
        "priceDisplay":  "PKR 1.2 Crore",
        "area":  "800 sq ft",
        "bathrooms":  1,
        "images":  [
                       "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800\u0026q=80"
                   ],
        "price":  12000000,
        "bedrooms":  1,
        "features":  [
                         "Elevator",
                         "Gym Access",
                         "24/7 Security"
                     ],
        "description":  "This beautiful budget Penthouse is ideally located in the heart of Bahria Town Phase 4, Islamabad. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-15T10:00:00Z",
        "contactInfo":  {
                            "email":  "ayesha.k@nestfinder.ai",
                            "name":  "Ayesha Khan",
                            "phone":  "+92 321 9876543"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800\u0026q=80"
    },
    {
        "id":  6,
        "budgetCategory":  "Luxury",
        "type":  "Office",
        "title":  "Luxury Office in DHA Phase 6",
        "location":  "DHA Phase 6, Karachi",
        "priceDisplay":  "PKR 7.5 Lakh/mo",
        "area":  "1200 sq ft",
        "bathrooms":  1,
        "images":  [
                       "https://images.unsplash.com/photo-1600566753190-17f0baa2a6b3?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800\u0026q=80"
                   ],
        "price":  750000,
        "bedrooms":  0,
        "features":  [
                         "Terrace",
                         "Servant Quarter",
                         "Backup Generator"
                     ],
        "description":  "This beautiful luxury Office is ideally located in the heart of DHA Phase 6, Karachi. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-14T10:00:00Z",
        "contactInfo":  {
                            "email":  "bilal@nestfinder.ai",
                            "name":  "Bilal Siddiqui",
                            "phone":  "+92 333 5558899"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6b3?w=800\u0026q=80"
    },
    {
        "id":  7,
        "budgetCategory":  "Premium",
        "type":  "Shop",
        "title":  "Premium Shop in Gulberg III",
        "location":  "Gulberg III, Lahore",
        "priceDisplay":  "PKR 12 Crore",
        "area":  "1800 sq ft",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\u0026q=80"
                   ],
        "price":  120000000,
        "bedrooms":  0,
        "features":  [
                         "Swimming Pool",
                         "Parking Garage",
                         "Gas Connection"
                     ],
        "description":  "This beautiful premium Shop is ideally located in the heart of Gulberg III, Lahore. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-13T10:00:00Z",
        "contactInfo":  {
                            "email":  "maria@nestfinder.ai",
                            "name":  "Maria Yousuf",
                            "phone":  "+92 315 2223344"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800\u0026q=80"
    },
    {
        "id":  8,
        "budgetCategory":  "Budget",
        "type":  "House",
        "title":  "Budget 4 Bed House in G-11 Sector",
        "location":  "G-11 Sector, Islamabad",
        "priceDisplay":  "PKR 65,000/mo",
        "area":  "120 sq yards",
        "bathrooms":  4,
        "images":  [
                       "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800\u0026q=80"
                   ],
        "price":  65000,
        "bedrooms":  4,
        "features":  [
                         "Gym Access",
                         "Lush Lawn",
                         "Water Supply"
                     ],
        "description":  "This beautiful budget House is ideally located in the heart of G-11 Sector, Islamabad. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-12T10:00:00Z",
        "contactInfo":  {
                            "email":  "zubair@nestfinder.ai",
                            "name":  "Zubair Ahmed",
                            "phone":  "+92 300 1234567"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800\u0026q=80"
    },
    {
        "id":  9,
        "budgetCategory":  "Luxury",
        "type":  "Apartment",
        "title":  "Luxury 5 Bed Apartment in PECHS Block 2",
        "location":  "PECHS Block 2, Karachi",
        "priceDisplay":  "PKR 22 Crore",
        "area":  "3600 sq ft",
        "bathrooms":  4,
        "images":  [
                       "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800\u0026q=80"
                   ],
        "price":  220000000,
        "bedrooms":  5,
        "features":  [
                         "Servant Quarter",
                         "24/7 Security",
                         "High-speed Internet"
                     ],
        "description":  "This beautiful luxury Apartment is ideally located in the heart of PECHS Block 2, Karachi. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-11T10:00:00Z",
        "contactInfo":  {
                            "email":  "ayesha.k@nestfinder.ai",
                            "name":  "Ayesha Khan",
                            "phone":  "+92 321 9876543"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800\u0026q=80"
    },
    {
        "id":  10,
        "budgetCategory":  "Premium",
        "type":  "Villa",
        "title":  "Premium 1 Bed Villa in Cavalry Ground",
        "location":  "Cavalry Ground, Lahore",
        "priceDisplay":  "PKR 2.2 Lakh/mo",
        "area":  "500 sq yards",
        "bathrooms":  1,
        "images":  [
                       "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\u0026q=80"
                   ],
        "price":  220000,
        "bedrooms":  1,
        "features":  [
                         "Parking Garage",
                         "Backup Generator",
                         "Elevator"
                     ],
        "description":  "This beautiful premium Villa is ideally located in the heart of Cavalry Ground, Lahore. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-10T10:00:00Z",
        "contactInfo":  {
                            "email":  "bilal@nestfinder.ai",
                            "name":  "Bilal Siddiqui",
                            "phone":  "+92 333 5558899"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800\u0026q=80"
    },
    {
        "id":  11,
        "budgetCategory":  "Budget",
        "type":  "Plot",
        "title":  "Budget Plot in Bahria Town Phase 4",
        "location":  "Bahria Town Phase 4, Islamabad",
        "priceDisplay":  "PKR 2.8 Crore",
        "area":  "1 Kanal",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800\u0026q=80"
                   ],
        "price":  28000000,
        "bedrooms":  0,
        "features":  [
                         "Lush Lawn",
                         "Gas Connection",
                         "Terrace"
                     ],
        "description":  "This beautiful budget Plot is ideally located in the heart of Bahria Town Phase 4, Islamabad. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-09T10:00:00Z",
        "contactInfo":  {
                            "email":  "maria@nestfinder.ai",
                            "name":  "Maria Yousuf",
                            "phone":  "+92 315 2223344"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800\u0026q=80"
    },
    {
        "id":  12,
        "budgetCategory":  "Luxury",
        "type":  "Commercial",
        "title":  "Luxury Commercial in DHA Phase 6",
        "location":  "DHA Phase 6, Karachi",
        "priceDisplay":  "PKR 3.5 Lakh/mo",
        "area":  "1800 sq ft",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800\u0026q=80"
                   ],
        "price":  350000,
        "bedrooms":  0,
        "features":  [
                         "24/7 Security",
                         "Water Supply",
                         "Swimming Pool"
                     ],
        "description":  "This beautiful luxury Commercial is ideally located in the heart of DHA Phase 6, Karachi. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-08T10:00:00Z",
        "contactInfo":  {
                            "email":  "zubair@nestfinder.ai",
                            "name":  "Zubair Ahmed",
                            "phone":  "+92 300 1234567"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800\u0026q=80"
    },
    {
        "id":  13,
        "budgetCategory":  "Premium",
        "type":  "Penthouse",
        "title":  "Premium 4 Bed Penthouse in Gulberg III",
        "location":  "Gulberg III, Lahore",
        "priceDisplay":  "PKR 6 Crore",
        "area":  "2400 sq ft",
        "bathrooms":  3,
        "images":  [
                       "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\u0026q=80"
                   ],
        "price":  60000000,
        "bedrooms":  4,
        "features":  [
                         "Backup Generator",
                         "High-speed Internet",
                         "Gym Access"
                     ],
        "description":  "This beautiful premium Penthouse is ideally located in the heart of Gulberg III, Lahore. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-07T10:00:00Z",
        "contactInfo":  {
                            "email":  "ayesha.k@nestfinder.ai",
                            "name":  "Ayesha Khan",
                            "phone":  "+92 321 9876543"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800\u0026q=80"
    },
    {
        "id":  14,
        "budgetCategory":  "Budget",
        "type":  "Office",
        "title":  "Budget Office in G-11 Sector",
        "location":  "G-11 Sector, Islamabad",
        "priceDisplay":  "PKR 85,000/mo",
        "area":  "3600 sq ft",
        "bathrooms":  3,
        "images":  [
                       "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f93?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800\u0026q=80"
                   ],
        "price":  85000,
        "bedrooms":  0,
        "features":  [
                         "Gas Connection",
                         "Elevator",
                         "Servant Quarter"
                     ],
        "description":  "This beautiful budget Office is ideally located in the heart of G-11 Sector, Islamabad. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-06T10:00:00Z",
        "contactInfo":  {
                            "email":  "bilal@nestfinder.ai",
                            "name":  "Bilal Siddiqui",
                            "phone":  "+92 333 5558899"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f93?w=800\u0026q=80"
    },
    {
        "id":  15,
        "budgetCategory":  "Luxury",
        "type":  "Shop",
        "title":  "Luxury Shop in PECHS Block 2",
        "location":  "PECHS Block 2, Karachi",
        "priceDisplay":  "PKR 50 Crore",
        "area":  "800 sq ft",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800\u0026q=80"
                   ],
        "price":  500000000,
        "bedrooms":  0,
        "features":  [
                         "Water Supply",
                         "Terrace",
                         "Parking Garage"
                     ],
        "description":  "This beautiful luxury Shop is ideally located in the heart of PECHS Block 2, Karachi. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-05T10:00:00Z",
        "contactInfo":  {
                            "email":  "maria@nestfinder.ai",
                            "name":  "Maria Yousuf",
                            "phone":  "+92 315 2223344"
                        },
        "category":  "For Sale",
        "status":  "Sold",
        "image":  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800\u0026q=80"
    },
    {
        "id":  16,
        "budgetCategory":  "Premium",
        "type":  "House",
        "title":  "Premium 2 Bed House in Cavalry Ground",
        "location":  "Cavalry Ground, Lahore",
        "priceDisplay":  "PKR 1.2 Lakh/mo",
        "area":  "120 sq yards",
        "bathrooms":  2,
        "images":  [
                       "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\u0026q=80"
                   ],
        "price":  120000,
        "bedrooms":  2,
        "features":  [
                         "High-speed Internet",
                         "Swimming Pool",
                         "Lush Lawn"
                     ],
        "description":  "This beautiful premium House is ideally located in the heart of Cavalry Ground, Lahore. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-04T10:00:00Z",
        "contactInfo":  {
                            "email":  "zubair@nestfinder.ai",
                            "name":  "Zubair Ahmed",
                            "phone":  "+92 300 1234567"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800\u0026q=80"
    },
    {
        "id":  17,
        "budgetCategory":  "Budget",
        "type":  "Apartment",
        "title":  "Budget 3 Bed Apartment in Bahria Town Phase 4",
        "location":  "Bahria Town Phase 4, Islamabad",
        "priceDisplay":  "PKR 1.2 Crore",
        "area":  "1800 sq ft",
        "bathrooms":  2,
        "images":  [
                       "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800\u0026q=80"
                   ],
        "price":  12000000,
        "bedrooms":  3,
        "features":  [
                         "Elevator",
                         "Gym Access",
                         "24/7 Security"
                     ],
        "description":  "This beautiful budget Apartment is ideally located in the heart of Bahria Town Phase 4, Islamabad. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-03T10:00:00Z",
        "contactInfo":  {
                            "email":  "ayesha.k@nestfinder.ai",
                            "name":  "Ayesha Khan",
                            "phone":  "+92 321 9876543"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800\u0026q=80"
    },
    {
        "id":  18,
        "budgetCategory":  "Luxury",
        "type":  "Villa",
        "title":  "Luxury 4 Bed Villa in DHA Phase 6",
        "location":  "DHA Phase 6, Karachi",
        "priceDisplay":  "PKR 7.5 Lakh/mo",
        "area":  "500 sq yards",
        "bathrooms":  4,
        "images":  [
                       "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800\u0026q=80"
                   ],
        "price":  750000,
        "bedrooms":  4,
        "features":  [
                         "Terrace",
                         "Servant Quarter",
                         "Backup Generator"
                     ],
        "description":  "This beautiful luxury Villa is ideally located in the heart of DHA Phase 6, Karachi. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-02T10:00:00Z",
        "contactInfo":  {
                            "email":  "bilal@nestfinder.ai",
                            "name":  "Bilal Siddiqui",
                            "phone":  "+92 333 5558899"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800\u0026q=80"
    },
    {
        "id":  19,
        "budgetCategory":  "Premium",
        "type":  "Plot",
        "title":  "Premium Plot in Gulberg III",
        "location":  "Gulberg III, Lahore",
        "priceDisplay":  "PKR 12 Crore",
        "area":  "1 Kanal",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\u0026q=80"
                   ],
        "price":  120000000,
        "bedrooms":  0,
        "features":  [
                         "Swimming Pool",
                         "Parking Garage",
                         "Gas Connection"
                     ],
        "description":  "This beautiful premium Plot is ideally located in the heart of Gulberg III, Lahore. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-06-01T10:00:00Z",
        "contactInfo":  {
                            "email":  "maria@nestfinder.ai",
                            "name":  "Maria Yousuf",
                            "phone":  "+92 315 2223344"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800\u0026q=80"
    },
    {
        "id":  20,
        "budgetCategory":  "Budget",
        "type":  "Commercial",
        "title":  "Budget Commercial in G-11 Sector",
        "location":  "G-11 Sector, Islamabad",
        "priceDisplay":  "PKR 25,000/mo",
        "area":  "800 sq ft",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800\u0026q=80"
                   ],
        "price":  25000,
        "bedrooms":  0,
        "features":  [
                         "Gym Access",
                         "Lush Lawn",
                         "Water Supply"
                     ],
        "description":  "This beautiful budget Commercial is ideally located in the heart of G-11 Sector, Islamabad. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-31T10:00:00Z",
        "contactInfo":  {
                            "email":  "zubair@nestfinder.ai",
                            "name":  "Zubair Ahmed",
                            "phone":  "+92 300 1234567"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800\u0026q=80"
    },
    {
        "id":  21,
        "budgetCategory":  "Luxury",
        "type":  "Penthouse",
        "title":  "Luxury 2 Bed Penthouse in PECHS Block 2",
        "location":  "PECHS Block 2, Karachi",
        "priceDisplay":  "PKR 22 Crore",
        "area":  "1200 sq ft",
        "bathrooms":  1,
        "images":  [
                       "https://images.unsplash.com/photo-1600566753190-17f0baa2a6b3?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800\u0026q=80"
                   ],
        "price":  220000000,
        "bedrooms":  2,
        "features":  [
                         "Servant Quarter",
                         "24/7 Security",
                         "High-speed Internet"
                     ],
        "description":  "This beautiful luxury Penthouse is ideally located in the heart of PECHS Block 2, Karachi. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-30T10:00:00Z",
        "contactInfo":  {
                            "email":  "ayesha.k@nestfinder.ai",
                            "name":  "Ayesha Khan",
                            "phone":  "+92 321 9876543"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6b3?w=800\u0026q=80"
    },
    {
        "id":  22,
        "budgetCategory":  "Premium",
        "type":  "Office",
        "title":  "Premium Office in Cavalry Ground",
        "location":  "Cavalry Ground, Lahore",
        "priceDisplay":  "PKR 2.2 Lakh/mo",
        "area":  "1800 sq ft",
        "bathrooms":  2,
        "images":  [
                       "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\u0026q=80"
                   ],
        "price":  220000,
        "bedrooms":  0,
        "features":  [
                         "Parking Garage",
                         "Backup Generator",
                         "Elevator"
                     ],
        "description":  "This beautiful premium Office is ideally located in the heart of Cavalry Ground, Lahore. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-29T10:00:00Z",
        "contactInfo":  {
                            "email":  "bilal@nestfinder.ai",
                            "name":  "Bilal Siddiqui",
                            "phone":  "+92 333 5558899"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800\u0026q=80"
    },
    {
        "id":  23,
        "budgetCategory":  "Budget",
        "type":  "Shop",
        "title":  "Budget Shop in Bahria Town Phase 4",
        "location":  "Bahria Town Phase 4, Islamabad",
        "priceDisplay":  "PKR 2.8 Crore",
        "area":  "2400 sq ft",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800\u0026q=80"
                   ],
        "price":  28000000,
        "bedrooms":  0,
        "features":  [
                         "Lush Lawn",
                         "Gas Connection",
                         "Terrace"
                     ],
        "description":  "This beautiful budget Shop is ideally located in the heart of Bahria Town Phase 4, Islamabad. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-28T10:00:00Z",
        "contactInfo":  {
                            "email":  "maria@nestfinder.ai",
                            "name":  "Maria Yousuf",
                            "phone":  "+92 315 2223344"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800\u0026q=80"
    },
    {
        "id":  24,
        "budgetCategory":  "Luxury",
        "type":  "House",
        "title":  "Luxury 5 Bed House in DHA Phase 6",
        "location":  "DHA Phase 6, Karachi",
        "priceDisplay":  "PKR 3.5 Lakh/mo",
        "area":  "120 sq yards",
        "bathrooms":  5,
        "images":  [
                       "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800\u0026q=80"
                   ],
        "price":  350000,
        "bedrooms":  5,
        "features":  [
                         "24/7 Security",
                         "Water Supply",
                         "Swimming Pool"
                     ],
        "description":  "This beautiful luxury House is ideally located in the heart of DHA Phase 6, Karachi. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-27T10:00:00Z",
        "contactInfo":  {
                            "email":  "zubair@nestfinder.ai",
                            "name":  "Zubair Ahmed",
                            "phone":  "+92 300 1234567"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800\u0026q=80"
    },
    {
        "id":  25,
        "budgetCategory":  "Premium",
        "type":  "Apartment",
        "title":  "Premium 1 Bed Apartment in Gulberg III",
        "location":  "Gulberg III, Lahore",
        "priceDisplay":  "PKR 6 Crore",
        "area":  "800 sq ft",
        "bathrooms":  1,
        "images":  [
                       "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\u0026q=80"
                   ],
        "price":  60000000,
        "bedrooms":  1,
        "features":  [
                         "Backup Generator",
                         "High-speed Internet",
                         "Gym Access"
                     ],
        "description":  "This beautiful premium Apartment is ideally located in the heart of Gulberg III, Lahore. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-26T10:00:00Z",
        "contactInfo":  {
                            "email":  "ayesha.k@nestfinder.ai",
                            "name":  "Ayesha Khan",
                            "phone":  "+92 321 9876543"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800\u0026q=80"
    },
    {
        "id":  26,
        "budgetCategory":  "Budget",
        "type":  "Villa",
        "title":  "Budget 2 Bed Villa in G-11 Sector",
        "location":  "G-11 Sector, Islamabad",
        "priceDisplay":  "PKR 35,000/mo",
        "area":  "500 sq yards",
        "bathrooms":  2,
        "images":  [
                       "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800\u0026q=80"
                   ],
        "price":  35000,
        "bedrooms":  2,
        "features":  [
                         "Gas Connection",
                         "Elevator",
                         "Servant Quarter"
                     ],
        "description":  "This beautiful budget Villa is ideally located in the heart of G-11 Sector, Islamabad. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-25T10:00:00Z",
        "contactInfo":  {
                            "email":  "bilal@nestfinder.ai",
                            "name":  "Bilal Siddiqui",
                            "phone":  "+92 333 5558899"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800\u0026q=80"
    },
    {
        "id":  27,
        "budgetCategory":  "Luxury",
        "type":  "Plot",
        "title":  "Luxury Plot in PECHS Block 2",
        "location":  "PECHS Block 2, Karachi",
        "priceDisplay":  "PKR 50 Crore",
        "area":  "1 Kanal",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800\u0026q=80"
                   ],
        "price":  500000000,
        "bedrooms":  0,
        "features":  [
                         "Water Supply",
                         "Terrace",
                         "Parking Garage"
                     ],
        "description":  "This beautiful luxury Plot is ideally located in the heart of PECHS Block 2, Karachi. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-24T10:00:00Z",
        "contactInfo":  {
                            "email":  "maria@nestfinder.ai",
                            "name":  "Maria Yousuf",
                            "phone":  "+92 315 2223344"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800\u0026q=80"
    },
    {
        "id":  28,
        "budgetCategory":  "Premium",
        "type":  "Commercial",
        "title":  "Premium Commercial in Cavalry Ground",
        "location":  "Cavalry Ground, Lahore",
        "priceDisplay":  "PKR 1.2 Lakh/mo",
        "area":  "2400 sq ft",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\u0026q=80"
                   ],
        "price":  120000,
        "bedrooms":  0,
        "features":  [
                         "High-speed Internet",
                         "Swimming Pool",
                         "Lush Lawn"
                     ],
        "description":  "This beautiful premium Commercial is ideally located in the heart of Cavalry Ground, Lahore. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-23T10:00:00Z",
        "contactInfo":  {
                            "email":  "zubair@nestfinder.ai",
                            "name":  "Zubair Ahmed",
                            "phone":  "+92 300 1234567"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800\u0026q=80"
    },
    {
        "id":  29,
        "budgetCategory":  "Budget",
        "type":  "Penthouse",
        "title":  "Budget 5 Bed Penthouse in Bahria Town Phase 4",
        "location":  "Bahria Town Phase 4, Islamabad",
        "priceDisplay":  "PKR 1.2 Crore",
        "area":  "3600 sq ft",
        "bathrooms":  4,
        "images":  [
                       "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f93?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800\u0026q=80"
                   ],
        "price":  12000000,
        "bedrooms":  5,
        "features":  [
                         "Elevator",
                         "Gym Access",
                         "24/7 Security"
                     ],
        "description":  "This beautiful budget Penthouse is ideally located in the heart of Bahria Town Phase 4, Islamabad. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-22T10:00:00Z",
        "contactInfo":  {
                            "email":  "ayesha.k@nestfinder.ai",
                            "name":  "Ayesha Khan",
                            "phone":  "+92 321 9876543"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f93?w=800\u0026q=80"
    },
    {
        "id":  30,
        "budgetCategory":  "Luxury",
        "type":  "Office",
        "title":  "Luxury Office in DHA Phase 6",
        "location":  "DHA Phase 6, Karachi",
        "priceDisplay":  "PKR 7.5 Lakh/mo",
        "area":  "800 sq ft",
        "bathrooms":  1,
        "images":  [
                       "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800\u0026q=80"
                   ],
        "price":  750000,
        "bedrooms":  0,
        "features":  [
                         "Terrace",
                         "Servant Quarter",
                         "Backup Generator"
                     ],
        "description":  "This beautiful luxury Office is ideally located in the heart of DHA Phase 6, Karachi. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-21T10:00:00Z",
        "contactInfo":  {
                            "email":  "bilal@nestfinder.ai",
                            "name":  "Bilal Siddiqui",
                            "phone":  "+92 333 5558899"
                        },
        "category":  "For Rent",
        "status":  "Rented",
        "image":  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800\u0026q=80"
    },
    {
        "id":  31,
        "budgetCategory":  "Premium",
        "type":  "Shop",
        "title":  "Premium Shop in Gulberg III",
        "location":  "Gulberg III, Lahore",
        "priceDisplay":  "PKR 12 Crore",
        "area":  "1200 sq ft",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\u0026q=80"
                   ],
        "price":  120000000,
        "bedrooms":  0,
        "features":  [
                         "Swimming Pool",
                         "Parking Garage",
                         "Gas Connection"
                     ],
        "description":  "This beautiful premium Shop is ideally located in the heart of Gulberg III, Lahore. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-20T10:00:00Z",
        "contactInfo":  {
                            "email":  "maria@nestfinder.ai",
                            "name":  "Maria Yousuf",
                            "phone":  "+92 315 2223344"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800\u0026q=80"
    },
    {
        "id":  32,
        "budgetCategory":  "Budget",
        "type":  "House",
        "title":  "Budget 3 Bed House in G-11 Sector",
        "location":  "G-11 Sector, Islamabad",
        "priceDisplay":  "PKR 45,000/mo",
        "area":  "120 sq yards",
        "bathrooms":  3,
        "images":  [
                       "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800\u0026q=80"
                   ],
        "price":  45000,
        "bedrooms":  3,
        "features":  [
                         "Gym Access",
                         "Lush Lawn",
                         "Water Supply"
                     ],
        "description":  "This beautiful budget House is ideally located in the heart of G-11 Sector, Islamabad. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-19T10:00:00Z",
        "contactInfo":  {
                            "email":  "zubair@nestfinder.ai",
                            "name":  "Zubair Ahmed",
                            "phone":  "+92 300 1234567"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800\u0026q=80"
    },
    {
        "id":  33,
        "budgetCategory":  "Luxury",
        "type":  "Apartment",
        "title":  "Luxury 4 Bed Apartment in PECHS Block 2",
        "location":  "PECHS Block 2, Karachi",
        "priceDisplay":  "PKR 22 Crore",
        "area":  "2400 sq ft",
        "bathrooms":  3,
        "images":  [
                       "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800\u0026q=80"
                   ],
        "price":  220000000,
        "bedrooms":  4,
        "features":  [
                         "Servant Quarter",
                         "24/7 Security",
                         "High-speed Internet"
                     ],
        "description":  "This beautiful luxury Apartment is ideally located in the heart of PECHS Block 2, Karachi. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-18T10:00:00Z",
        "contactInfo":  {
                            "email":  "ayesha.k@nestfinder.ai",
                            "name":  "Ayesha Khan",
                            "phone":  "+92 321 9876543"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800\u0026q=80"
    },
    {
        "id":  34,
        "budgetCategory":  "Premium",
        "type":  "Villa",
        "title":  "Premium 5 Bed Villa in Cavalry Ground",
        "location":  "Cavalry Ground, Lahore",
        "priceDisplay":  "PKR 2.2 Lakh/mo",
        "area":  "500 sq yards",
        "bathrooms":  5,
        "images":  [
                       "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\u0026q=80"
                   ],
        "price":  220000,
        "bedrooms":  5,
        "features":  [
                         "Parking Garage",
                         "Backup Generator",
                         "Elevator"
                     ],
        "description":  "This beautiful premium Villa is ideally located in the heart of Cavalry Ground, Lahore. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-17T10:00:00Z",
        "contactInfo":  {
                            "email":  "bilal@nestfinder.ai",
                            "name":  "Bilal Siddiqui",
                            "phone":  "+92 333 5558899"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800\u0026q=80"
    },
    {
        "id":  35,
        "budgetCategory":  "Budget",
        "type":  "Plot",
        "title":  "Budget Plot in Bahria Town Phase 4",
        "location":  "Bahria Town Phase 4, Islamabad",
        "priceDisplay":  "PKR 2.8 Crore",
        "area":  "1 Kanal",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800\u0026q=80"
                   ],
        "price":  28000000,
        "bedrooms":  0,
        "features":  [
                         "Lush Lawn",
                         "Gas Connection",
                         "Terrace"
                     ],
        "description":  "This beautiful budget Plot is ideally located in the heart of Bahria Town Phase 4, Islamabad. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-16T10:00:00Z",
        "contactInfo":  {
                            "email":  "maria@nestfinder.ai",
                            "name":  "Maria Yousuf",
                            "phone":  "+92 315 2223344"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800\u0026q=80"
    },
    {
        "id":  36,
        "budgetCategory":  "Luxury",
        "type":  "Commercial",
        "title":  "Luxury Commercial in DHA Phase 6",
        "location":  "DHA Phase 6, Karachi",
        "priceDisplay":  "PKR 3.5 Lakh/mo",
        "area":  "1200 sq ft",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1600566753190-17f0baa2a6b3?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800\u0026q=80"
                   ],
        "price":  350000,
        "bedrooms":  0,
        "features":  [
                         "24/7 Security",
                         "Water Supply",
                         "Swimming Pool"
                     ],
        "description":  "This beautiful luxury Commercial is ideally located in the heart of DHA Phase 6, Karachi. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-15T10:00:00Z",
        "contactInfo":  {
                            "email":  "zubair@nestfinder.ai",
                            "name":  "Zubair Ahmed",
                            "phone":  "+92 300 1234567"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6b3?w=800\u0026q=80"
    },
    {
        "id":  37,
        "budgetCategory":  "Premium",
        "type":  "Penthouse",
        "title":  "Premium 3 Bed Penthouse in Gulberg III",
        "location":  "Gulberg III, Lahore",
        "priceDisplay":  "PKR 6 Crore",
        "area":  "1800 sq ft",
        "bathrooms":  2,
        "images":  [
                       "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\u0026q=80"
                   ],
        "price":  60000000,
        "bedrooms":  3,
        "features":  [
                         "Backup Generator",
                         "High-speed Internet",
                         "Gym Access"
                     ],
        "description":  "This beautiful premium Penthouse is ideally located in the heart of Gulberg III, Lahore. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-14T10:00:00Z",
        "contactInfo":  {
                            "email":  "ayesha.k@nestfinder.ai",
                            "name":  "Ayesha Khan",
                            "phone":  "+92 321 9876543"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800\u0026q=80"
    },
    {
        "id":  38,
        "budgetCategory":  "Budget",
        "type":  "Office",
        "title":  "Budget Office in G-11 Sector",
        "location":  "G-11 Sector, Islamabad",
        "priceDisplay":  "PKR 65,000/mo",
        "area":  "2400 sq ft",
        "bathrooms":  3,
        "images":  [
                       "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800\u0026q=80"
                   ],
        "price":  65000,
        "bedrooms":  0,
        "features":  [
                         "Gas Connection",
                         "Elevator",
                         "Servant Quarter"
                     ],
        "description":  "This beautiful budget Office is ideally located in the heart of G-11 Sector, Islamabad. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-13T10:00:00Z",
        "contactInfo":  {
                            "email":  "bilal@nestfinder.ai",
                            "name":  "Bilal Siddiqui",
                            "phone":  "+92 333 5558899"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800\u0026q=80"
    },
    {
        "id":  39,
        "budgetCategory":  "Luxury",
        "type":  "Shop",
        "title":  "Luxury Shop in PECHS Block 2",
        "location":  "PECHS Block 2, Karachi",
        "priceDisplay":  "PKR 50 Crore",
        "area":  "3600 sq ft",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800\u0026q=80"
                   ],
        "price":  500000000,
        "bedrooms":  0,
        "features":  [
                         "Water Supply",
                         "Terrace",
                         "Parking Garage"
                     ],
        "description":  "This beautiful luxury Shop is ideally located in the heart of PECHS Block 2, Karachi. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-12T10:00:00Z",
        "contactInfo":  {
                            "email":  "maria@nestfinder.ai",
                            "name":  "Maria Yousuf",
                            "phone":  "+92 315 2223344"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800\u0026q=80"
    },
    {
        "id":  40,
        "budgetCategory":  "Premium",
        "type":  "House",
        "title":  "Premium 1 Bed House in Cavalry Ground",
        "location":  "Cavalry Ground, Lahore",
        "priceDisplay":  "PKR 1.2 Lakh/mo",
        "area":  "120 sq yards",
        "bathrooms":  1,
        "images":  [
                       "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\u0026q=80"
                   ],
        "price":  120000,
        "bedrooms":  1,
        "features":  [
                         "High-speed Internet",
                         "Swimming Pool",
                         "Lush Lawn"
                     ],
        "description":  "This beautiful premium House is ideally located in the heart of Cavalry Ground, Lahore. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-11T10:00:00Z",
        "contactInfo":  {
                            "email":  "zubair@nestfinder.ai",
                            "name":  "Zubair Ahmed",
                            "phone":  "+92 300 1234567"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800\u0026q=80"
    },
    {
        "id":  41,
        "budgetCategory":  "Budget",
        "type":  "Apartment",
        "title":  "Budget 2 Bed Apartment in Bahria Town Phase 4",
        "location":  "Bahria Town Phase 4, Islamabad",
        "priceDisplay":  "PKR 1.2 Crore",
        "area":  "1200 sq ft",
        "bathrooms":  1,
        "images":  [
                       "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800\u0026q=80"
                   ],
        "price":  12000000,
        "bedrooms":  2,
        "features":  [
                         "Elevator",
                         "Gym Access",
                         "24/7 Security"
                     ],
        "description":  "This beautiful budget Apartment is ideally located in the heart of Bahria Town Phase 4, Islamabad. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-10T10:00:00Z",
        "contactInfo":  {
                            "email":  "ayesha.k@nestfinder.ai",
                            "name":  "Ayesha Khan",
                            "phone":  "+92 321 9876543"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800\u0026q=80"
    },
    {
        "id":  42,
        "budgetCategory":  "Luxury",
        "type":  "Villa",
        "title":  "Luxury 3 Bed Villa in DHA Phase 6",
        "location":  "DHA Phase 6, Karachi",
        "priceDisplay":  "PKR 7.5 Lakh/mo",
        "area":  "500 sq yards",
        "bathrooms":  3,
        "images":  [
                       "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800\u0026q=80"
                   ],
        "price":  750000,
        "bedrooms":  3,
        "features":  [
                         "Terrace",
                         "Servant Quarter",
                         "Backup Generator"
                     ],
        "description":  "This beautiful luxury Villa is ideally located in the heart of DHA Phase 6, Karachi. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-09T10:00:00Z",
        "contactInfo":  {
                            "email":  "bilal@nestfinder.ai",
                            "name":  "Bilal Siddiqui",
                            "phone":  "+92 333 5558899"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800\u0026q=80"
    },
    {
        "id":  43,
        "budgetCategory":  "Premium",
        "type":  "Plot",
        "title":  "Premium Plot in Gulberg III",
        "location":  "Gulberg III, Lahore",
        "priceDisplay":  "PKR 12 Crore",
        "area":  "1 Kanal",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\u0026q=80"
                   ],
        "price":  120000000,
        "bedrooms":  0,
        "features":  [
                         "Swimming Pool",
                         "Parking Garage",
                         "Gas Connection"
                     ],
        "description":  "This beautiful premium Plot is ideally located in the heart of Gulberg III, Lahore. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-08T10:00:00Z",
        "contactInfo":  {
                            "email":  "maria@nestfinder.ai",
                            "name":  "Maria Yousuf",
                            "phone":  "+92 315 2223344"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800\u0026q=80"
    },
    {
        "id":  44,
        "budgetCategory":  "Budget",
        "type":  "Commercial",
        "title":  "Budget Commercial in G-11 Sector",
        "location":  "G-11 Sector, Islamabad",
        "priceDisplay":  "PKR 85,000/mo",
        "area":  "3600 sq ft",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f93?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800\u0026q=80"
                   ],
        "price":  85000,
        "bedrooms":  0,
        "features":  [
                         "Gym Access",
                         "Lush Lawn",
                         "Water Supply"
                     ],
        "description":  "This beautiful budget Commercial is ideally located in the heart of G-11 Sector, Islamabad. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-07T10:00:00Z",
        "contactInfo":  {
                            "email":  "zubair@nestfinder.ai",
                            "name":  "Zubair Ahmed",
                            "phone":  "+92 300 1234567"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f93?w=800\u0026q=80"
    },
    {
        "id":  45,
        "budgetCategory":  "Luxury",
        "type":  "Penthouse",
        "title":  "Luxury 8 Bed Penthouse in PECHS Block 2",
        "location":  "PECHS Block 2, Karachi",
        "priceDisplay":  "PKR 22 Crore",
        "area":  "800 sq ft",
        "bathrooms":  7,
        "images":  [
                       "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800\u0026q=80"
                   ],
        "price":  220000000,
        "bedrooms":  8,
        "features":  [
                         "Servant Quarter",
                         "24/7 Security",
                         "High-speed Internet"
                     ],
        "description":  "This beautiful luxury Penthouse is ideally located in the heart of PECHS Block 2, Karachi. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-06T10:00:00Z",
        "contactInfo":  {
                            "email":  "ayesha.k@nestfinder.ai",
                            "name":  "Ayesha Khan",
                            "phone":  "+92 321 9876543"
                        },
        "category":  "For Sale",
        "status":  "Sold",
        "image":  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800\u0026q=80"
    },
    {
        "id":  46,
        "budgetCategory":  "Premium",
        "type":  "Office",
        "title":  "Premium Office in Cavalry Ground",
        "location":  "Cavalry Ground, Lahore",
        "priceDisplay":  "PKR 2.2 Lakh/mo",
        "area":  "1200 sq ft",
        "bathrooms":  2,
        "images":  [
                       "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\u0026q=80"
                   ],
        "price":  220000,
        "bedrooms":  0,
        "features":  [
                         "Parking Garage",
                         "Backup Generator",
                         "Elevator"
                     ],
        "description":  "This beautiful premium Office is ideally located in the heart of Cavalry Ground, Lahore. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-05T10:00:00Z",
        "contactInfo":  {
                            "email":  "bilal@nestfinder.ai",
                            "name":  "Bilal Siddiqui",
                            "phone":  "+92 333 5558899"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800\u0026q=80"
    },
    {
        "id":  47,
        "budgetCategory":  "Budget",
        "type":  "Shop",
        "title":  "Budget Shop in Bahria Town Phase 4",
        "location":  "Bahria Town Phase 4, Islamabad",
        "priceDisplay":  "PKR 2.8 Crore",
        "area":  "1800 sq ft",
        "bathrooms":  0,
        "images":  [
                       "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800\u0026q=80"
                   ],
        "price":  28000000,
        "bedrooms":  0,
        "features":  [
                         "Lush Lawn",
                         "Gas Connection",
                         "Terrace"
                     ],
        "description":  "This beautiful budget Shop is ideally located in the heart of Bahria Town Phase 4, Islamabad. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-04T10:00:00Z",
        "contactInfo":  {
                            "email":  "maria@nestfinder.ai",
                            "name":  "Maria Yousuf",
                            "phone":  "+92 315 2223344"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800\u0026q=80"
    },
    {
        "id":  48,
        "budgetCategory":  "Luxury",
        "type":  "House",
        "title":  "Luxury 4 Bed House in DHA Phase 6",
        "location":  "DHA Phase 6, Karachi",
        "priceDisplay":  "PKR 3.5 Lakh/mo",
        "area":  "120 sq yards",
        "bathrooms":  4,
        "images":  [
                       "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800\u0026q=80"
                   ],
        "price":  350000,
        "bedrooms":  4,
        "features":  [
                         "24/7 Security",
                         "Water Supply",
                         "Swimming Pool"
                     ],
        "description":  "This beautiful luxury House is ideally located in the heart of DHA Phase 6, Karachi. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-03T10:00:00Z",
        "contactInfo":  {
                            "email":  "zubair@nestfinder.ai",
                            "name":  "Zubair Ahmed",
                            "phone":  "+92 300 1234567"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800\u0026q=80"
    },
    {
        "id":  49,
        "budgetCategory":  "Premium",
        "type":  "Apartment",
        "title":  "Premium 5 Bed Apartment in Gulberg III",
        "location":  "Gulberg III, Lahore",
        "priceDisplay":  "PKR 6 Crore",
        "area":  "3600 sq ft",
        "bathrooms":  4,
        "images":  [
                       "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\u0026q=80"
                   ],
        "price":  60000000,
        "bedrooms":  5,
        "features":  [
                         "Backup Generator",
                         "High-speed Internet",
                         "Gym Access"
                     ],
        "description":  "This beautiful premium Apartment is ideally located in the heart of Gulberg III, Lahore. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-02T10:00:00Z",
        "contactInfo":  {
                            "email":  "ayesha.k@nestfinder.ai",
                            "name":  "Ayesha Khan",
                            "phone":  "+92 321 9876543"
                        },
        "category":  "For Sale",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800\u0026q=80"
    },
    {
        "id":  50,
        "budgetCategory":  "Budget",
        "type":  "Villa",
        "title":  "Budget 10 Bed Villa in G-11 Sector",
        "location":  "G-11 Sector, Islamabad",
        "priceDisplay":  "PKR 25,000/mo",
        "area":  "500 sq yards",
        "bathrooms":  8,
        "images":  [
                       "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800\u0026q=80",
                       "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800\u0026q=80"
                   ],
        "price":  25000,
        "bedrooms":  10,
        "features":  [
                         "Gas Connection",
                         "Elevator",
                         "Servant Quarter"
                     ],
        "description":  "This beautiful budget Villa is ideally located in the heart of G-11 Sector, Islamabad. It offers modern architectural design, high-quality finishes, and easy accessibility to central markets, healthcare centers, and educational institutions. An ideal choice for dynamic urban living in Pakistan.",
        "createdAt":  "2026-05-01T10:00:00Z",
        "contactInfo":  {
                            "email":  "bilal@nestfinder.ai",
                            "name":  "Bilal Siddiqui",
                            "phone":  "+92 333 5558899"
                        },
        "category":  "For Rent",
        "status":  "Active",
        "image":  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800\u0026q=80"
    }
]
;

  /**
   * Helper to retrieve properties from LocalStorage.
   * Returns null if database is not initialized.
   */
  function getLocalData() {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Failed to read from localStorage:", e);
      return null;
    }
  }

  /**
   * Helper to write properties to LocalStorage.
   */
  function setLocalData(data) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("Failed to write to localStorage:", e);
      return false;
    }
  }

  return {
    /**
     * Fetch all properties. Initializes from JSON or embedded fallback.
     * @returns {Promise<Array>} List of properties.
     */
    async fetchAll() {
      let data = getLocalData();
      if (!data) {
        try {
          const response = await fetch(JSON_DATA_PATH);
          if (!response.ok) {
            throw new Error(Failed to fetch \: \);
          }
          data = await response.json();
          setLocalData(data);
        } catch (error) {
          console.warn("Failed to initialize database from properties.json (likely CORS or file:// protocol). Using embedded fallback list:", error);
          data = DEFAULT_PROPERTIES;
          setLocalData(data);
        }
      }
      return data;
    },

    /**
     * Fetch a single property by ID.
     * @param {number|string} id The property ID.
     * @returns {Promise<Object|null>} The property object or null.
     */
    async getById(id) {
      const list = await this.fetchAll();
      const numId = parseInt(id, 10);
      return list.find(p => p.id === numId) || null;
    },

    /**
     * Create a new property.
     * @param {Object} propData Property parameters.
     * @returns {Promise<Object>} The created property with ID and dates.
     */
    async create(propData) {
      const list = await this.fetchAll();
      
      // Auto-increment ID
      const maxId = list.reduce((max, p) => p.id > max ? p.id : max, 0);
      const newProperty = {
        id: maxId + 1,
        title: propData.title || "Untitled Property",
        type: propData.type || "House",
        category: propData.category || "For Sale",
        budgetCategory: propData.budgetCategory || "Premium",
        price: Number(propData.price) || 0,
        priceDisplay: propData.priceDisplay || "Price on Request",
        location: propData.location || "Pakistan",
        bedrooms: parseInt(propData.bedrooms, 10) || 0,
        bathrooms: parseInt(propData.bathrooms, 10) || 0,
        area: propData.area || "0 sq ft",
        description: propData.description || "",
        image: propData.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
        images: propData.images || [propData.image],
        features: Array.isArray(propData.features) ? propData.features : [],
        contactInfo: propData.contactInfo || {
          name: "NestFinder Support",
          phone: "+92 300 1234567",
          email: "hello@nestfinder.ai"
        },
        status: propData.status || "Active",
        createdAt: new Date().toISOString()
      };

      list.unshift(newProperty); // Prepend to show new creations first
      setLocalData(list);
      return newProperty;
    },

    /**
     * Update an existing property.
     * @param {number|string} id Property ID.
     * @param {Object} propData Fields to update.
     * @returns {Promise<Object|null>} Updated property or null if not found.
     */
    async update(id, propData) {
      const list = await this.fetchAll();
      const numId = parseInt(id, 10);
      const index = list.findIndex(p => p.id === numId);
      
      if (index === -1) return null;

      // Merge existing with updates
      const updated = {
        ...list[index],
        ...propData,
        id: numId // Prevent overwriting ID
      };

      // Ensure correct types
      if (propData.price !== undefined) updated.price = Number(propData.price);
      if (propData.bedrooms !== undefined) updated.bedrooms = parseInt(propData.bedrooms, 10);
      if (propData.bathrooms !== undefined) updated.bathrooms = parseInt(propData.bathrooms, 10);

      list[index] = updated;
      setLocalData(list);
      return updated;
    },

    /**
     * Delete a property by ID.
     * @param {number|string} id Property ID.
     * @returns {Promise<boolean>} True if deleted successfully.
     */
    async delete(id) {
      const list = await this.fetchAll();
      const numId = parseInt(id, 10);
      const filtered = list.filter(p => p.id !== numId);
      
      if (filtered.length === list.length) {
        return false; // Nothing deleted
      }

      setLocalData(filtered);
      return true;
    },

    /**
     * Reset the database back to initial state.
     * @returns {Promise<Array>} The fresh list.
     */
    async reset() {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return await this.fetchAll();
    }
  };
})();

// Export globally
window.NestFinderAPI = NestFinderAPI;
