
/* =========================================================
   NEXORA — PROFESSIONAL E-COMMERCE JAVASCRIPT
   FRONTEND + DJANGO REST API
   ========================================================= */


/* =========================================================
   1. CONFIGURATION
   ========================================================= */

const CONFIG = {
    apiBaseUrl: getApiBaseUrl(),
    taxRate: 0.10,
    shipping: 0,
    currency: "Rs.",

    tokenKey: "nexoraToken",
    cartKey: "nexoraCart",
    ordersKey: "nexoraOrders"
};


/* =========================================================
   2. API BASE URL
   ========================================================= */

function getApiBaseUrl() {

    if (
        window.location.protocol === "file:" ||
        (
            window.location.port !== "" &&
            window.location.port !== "8000"
        )
    ) {
        return "http://127.0.0.1:8000/api";
    }

    return "/api";
}


/* =========================================================
   3. STATIC PRODUCT CATALOG
   ========================================================= */

const staticProducts = [

    {
        id: 1,
        name: "Wireless Headphones",
        price: 4999,
        category: "Electronics",
        description:
            "Premium wireless headphones with immersive sound, comfortable ear cushions and an everyday modern design.",
        image:
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
        badge: "NEXORA PICK",
        rating: 4.8
    },

    {
        id: 2,
        name: "Smart Watch",
        price: 8999,
        category: "Lifestyle",
        description:
            "A modern smartwatch designed to keep your everyday activity, notifications and lifestyle organized.",
        image:
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85",
        badge: "POPULAR",
        rating: 4.7
    },

    {
        id: 3,
        name: "Minimal Backpack",
        price: 3499,
        category: "Accessories",
        description:
            "A clean and practical backpack with a minimalist design for work, university and everyday travel.",
        image:
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85",
        badge: "ESSENTIAL",
        rating: 4.6
    },

    {
        id: 4,
        name: "Running Shoes",
        price: 6499,
        category: "Fashion",
        description:
            "Lightweight everyday running shoes built for comfort, movement and an active lifestyle.",
        image:
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
        badge: "TRENDING",
        rating: 4.8
    },

    {
        id: 5,
        name: "Wireless Mouse",
        price: 2499,
        category: "Electronics",
        description:
            "A compact wireless mouse with smooth tracking and a comfortable shape for work and study.",
        image:
            "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=85",
        badge: "SMART PICK",
        rating: 4.5
    },

    {
        id: 6,
        name: "Mechanical Keyboard",
        price: 5999,
        category: "Electronics",
        description:
            "A responsive mechanical keyboard with a modern layout for productive work, coding and gaming.",
        image:
            "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85",
        badge: "FEATURED",
        rating: 4.9
    }

];


/* =========================================================
   4. APPLICATION STATE
   ========================================================= */

let products = [...staticProducts];

let cart = loadCart();

let selectedProduct = null;

let currentProducts = [...products];

let orders = loadOrders();

let currentUser = null;


/* =========================================================
   5. DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initializeNexora();
    }
);


/* =========================================================
   6. INITIALIZATION
   ========================================================= */

async function initializeNexora() {

    console.log("====================================");
    console.log("NEXORA INITIALIZATION");
    console.log("====================================");

    setupNavigation();

    setupProductControls();

    setupCartEvents();

    setupProductDetailsEvents();

    setupCheckout();

    setupContactForm();

    setupAuthentication();

    renderCart();

    renderCheckoutSummary();

    renderOrders();

    renderProducts();

    updateCartCount();

    await loadProductsFromAPI();

    await loadCurrentUser();

    if (isLoggedIn()) {

        await loadCartFromAPI();

        await loadOrdersFromAPI();

    }

    setupImageFallback();

    console.log(
        "NEXORA initialized successfully."
    );

    console.log(
        "Products:",
        products.length
    );

    console.log(
        "Cart:",
        cart
    );

    console.log(
        "Logged in:",
        isLoggedIn()
    );
}


/* =========================================================
   7. API HELPER
   ========================================================= */

async function apiFetch(
    endpoint,
    options = {}
) {

    const url =
        endpoint.startsWith("http")
            ? endpoint
            : `${CONFIG.apiBaseUrl}${endpoint}`;


    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };


    const token =
        getToken();


    if (token) {

        headers.Authorization =
            `Token ${token}`;

    }


    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch {

        data = null;

    }


    if (!response.ok) {

        if (
            response.status === 401
        ) {

            clearToken();

            currentUser = null;

        }


        let message =
            data?.detail ||
            data?.error ||
            data?.message;


        if (!message && data) {

            message =
                Object.values(data)
                    .flat()
                    .join(" ");

        }


        throw new Error(
            message ||
            `API request failed: ${response.status}`
        );

    }


    return data;
}


/* =========================================================
   8. AUTH TOKEN
   ========================================================= */

function getToken() {

    return localStorage.getItem(
        CONFIG.tokenKey
    );

}


function saveToken(token) {

    if (token) {

        localStorage.setItem(
            CONFIG.tokenKey,
            token
        );

    }

}


function clearToken() {

    localStorage.removeItem(
        CONFIG.tokenKey
    );

}


function isLoggedIn() {

    return Boolean(
        getToken()
    );

}


/* =========================================================
   9. LOCAL STORAGE — CART
   ========================================================= */

function loadCart() {

    try {

        const savedCart =
            JSON.parse(
                localStorage.getItem(
                    CONFIG.cartKey
                )
            );


        if (!Array.isArray(savedCart)) {

            return [];

        }


        return savedCart.map(
            item => ({

                id: item.id,

                name: item.name,

                price:
                    Number(item.price) || 0,

                image:
                    item.image || "",

                category:
                    item.category ||
                    "General",

                quantity:
                    Math.max(
                        1,
                        Number(item.quantity) || 1
                    )

            })
        );

    } catch (error) {

        console.error(
            "Cart loading error:",
            error
        );

        return [];

    }

}


function saveCart() {

    localStorage.setItem(
        CONFIG.cartKey,
        JSON.stringify(cart)
    );

}


/* =========================================================
   10. LOCAL ORDERS
   ========================================================= */

function loadOrders() {

    try {

        const savedOrders =
            JSON.parse(
                localStorage.getItem(
                    CONFIG.ordersKey
                )
            );


        return Array.isArray(savedOrders)
            ? savedOrders
            : [];

    } catch {

        return [];

    }

}


function saveOrders() {

    localStorage.setItem(
        CONFIG.ordersKey,
        JSON.stringify(orders)
    );

}


/* =========================================================
   11. CURRENCY
   ========================================================= */

function formatPKR(value) {

    const amount =
        Number(value) || 0;


    return (
        "Rs. " +
        amount.toLocaleString(
            "en-PK",
            {
                maximumFractionDigits: 0
            }
        )
    );

}


/* =========================================================
   12. SAFE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   13. LOAD PRODUCTS FROM DJANGO
   ========================================================= */

async function loadProductsFromAPI() {

    console.log(
        "Trying Django API:",
        `${CONFIG.apiBaseUrl}/products/`
    );


    try {

        const data =
            await apiFetch(
                "/products/"
            );


        const apiProducts =
            Array.isArray(data)
                ? data
                : Array.isArray(data.results)
                    ? data.results
                    : [];


        console.log(
            "Products received from Django:",
            apiProducts
        );


        if (
            apiProducts.length === 0
        ) {

            console.log(
                "Django returned no products. Static catalog remains active."
            );

            return;

        }


        apiProducts.forEach(
            apiProduct => {

                const normalized =
                    normalizeApiProduct(
                        apiProduct
                    );


                const existingIndex =
                    products.findIndex(
                        product =>
                            String(product.id) ===
                            String(normalized.id)
                    );


                if (
                    existingIndex !== -1
                ) {

                    products[
                        existingIndex
                    ] = {

                        ...products[
                            existingIndex
                        ],

                        ...normalized

                    };

                } else {

                    products.push(
                        normalized
                    );

                }

            }
        );


        currentProducts =
            [...products];


        renderProducts();


        console.log(
            "Final NEXORA product count:",
            products.length
        );

    } catch (error) {

        console.warn(
            "Django API unavailable. Using local product catalog.",
            error.message
        );

    }

}


/* =========================================================
   14. NORMALIZE DJANGO PRODUCT
   ========================================================= */

function normalizeApiProduct(product) {

    const name =
        product.name ||
        product.title ||
        "NEXORA Product";


    const price =
        Number(product.price) || 0;


    const category =
        product.category ||
        "General";


    const existing =
        products.find(
            item =>
                String(item.id) ===
                String(product.id)
        );


    return {

        id:
            product.id ??
            `api-${Date.now()}`,

        name,

        price,

        category,

        description:
            product.description ||
            existing?.description ||
            `Discover ${name} from the NEXORA collection.`,

        image:
            product.image ||
            product.image_url ||
            existing?.image ||
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85",

        badge:
            existing?.badge ||
            "NEW",

        rating:
            Number(product.rating) ||
            existing?.rating ||
            4.5,

        stock:
            Number(product.stock ?? 0),

        is_active:
            product.is_active !== false

    };

}


/* =========================================================
   15. PRODUCT RENDERING
   ========================================================= */

function renderProducts() {

    const container =
        document.querySelector(
            ".product-container"
        );


    if (!container) {

        return;

    }


    if (
        currentProducts.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <h3>
                    No products found
                </h3>

                <p>
                    Try changing your search
                    or category filter.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        currentProducts
            .map(createProductCard)
            .join("");


    setupImageFallback();

}


/* =========================================================
   16. PRODUCT CARD
   ========================================================= */

function createProductCard(product) {

    const rating =
        Math.min(
            5,
            Math.max(
                0,
                Number(product.rating) || 4.5
            )
        );


    const stars =
        "★".repeat(
            Math.round(rating)
        ) +
        "☆".repeat(
            5 - Math.round(rating)
        );


    const outOfStock =
        Number(product.stock) <= 0;


    return `

        <article
            class="product-card"
            data-product-id="${escapeHTML(product.id)}"
        >

            <div class="product-image-wrapper">

                <img
                    src="${escapeHTML(product.image)}"
                    alt="${escapeHTML(product.name)}"
                    loading="lazy"
                >

                <span class="product-badge">
                    ${escapeHTML(
                        product.badge ||
                        "FEATURED"
                    )}
                </span>

                <button
                    type="button"
                    class="product-wishlist"
                    aria-label="Add to wishlist"
                    data-action="wishlist"
                >
                    ♡
                </button>

            </div>


            <div class="product-info">

                <span class="product-category">
                    ${escapeHTML(
                        product.category
                    )}
                </span>


                <h3>
                    ${escapeHTML(
                        product.name
                    )}
                </h3>


                <p class="product-description">
                    ${escapeHTML(
                        product.description
                    )}
                </p>


                <div class="product-rating">

                    <span class="rating-stars">
                        ${stars}
                    </span>

                    <span class="rating-text">
                        ${rating.toFixed(1)}
                    </span>

                </div>


                <div class="product-bottom">

                    <strong class="product-price">
                        ${formatPKR(
                            product.price
                        )}
                    </strong>


                    <button
                        type="button"
                        data-action="view-details"
                    >
                        View Details
                    </button>


                    <button
                        type="button"
                        data-action="add-cart"
                        ${outOfStock ? "disabled" : ""}
                    >
                        ${
                            outOfStock
                                ? "Out of Stock"
                                : "Add to Cart"
                        }
                    </button>

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   17. PRODUCT CONTROLS
   ========================================================= */

function setupProductControls() {

    const searchInput =
        document.querySelector(
            "#product-search"
        );


    const categoryFilter =
        document.querySelector(
            "#category-filter"
        );


    const priceSort =
        document.querySelector(
            "#price-sort"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyProductFilters
        );

    }


    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            applyProductFilters
        );

    }


    if (priceSort) {

        priceSort.addEventListener(
            "change",
            applyProductFilters
        );

    }


    const container =
        document.querySelector(
            ".product-container"
        );


    if (container) {

        container.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "button"
                    );


                if (!button) {

                    return;

                }


                const card =
                    button.closest(
                        ".product-card"
                    );


                if (!card) {

                    return;

                }


                const productId =
                    card.dataset.productId;


                const action =
                    button.dataset.action;


                if (
                    action ===
                    "add-cart"
                ) {

                    addToCart(
                        productId,
                        1
                    );

                }


                if (
                    action ===
                    "view-details"
                ) {

                    showProductDetails(
                        productId
                    );

                }


                if (
                    action ===
                    "wishlist"
                ) {

                    showNotification(
                        "Wishlist feature is ready for the next phase."
                    );

                }

            }
        );

    }

}


/* =========================================================
   18. FILTER PRODUCTS
   ========================================================= */

function applyProductFilters() {

    const searchInput =
        document.querySelector(
            "#product-search"
        );


    const categoryFilter =
        document.querySelector(
            "#category-filter"
        );


    const priceSort =
        document.querySelector(
            "#price-sort"
        );


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const category =
        categoryFilter
            ? categoryFilter.value
            : "all";


    currentProducts =
        products.filter(
            product => {

                const matchesSearch =
                    product.name
                        .toLowerCase()
                        .includes(search) ||

                    product.description
                        .toLowerCase()
                        .includes(search);


                const matchesCategory =
                    category === "all" ||
                    category === "" ||
                    product.category === category;


                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    if (priceSort) {

        switch (
            priceSort.value
        ) {

            case "low-high":

                currentProducts.sort(
                    (a, b) =>
                        a.price - b.price
                );

                break;


            case "high-low":

                currentProducts.sort(
                    (a, b) =>
                        b.price - a.price
                );

                break;


            case "name-a-z":

                currentProducts.sort(
                    (a, b) =>
                        a.name.localeCompare(
                            b.name
                        )
                );

                break;


            case "name-z-a":

                currentProducts.sort(
                    (a, b) =>
                        b.name.localeCompare(
                            a.name
                        )
                );

                break;

        }

    }


    renderProducts();

}


/* =========================================================
   19. ADD TO CART — API CONNECTED
   ========================================================= */

async function addToCart(
    productId,
    quantity = 1
) {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!product) {

        showNotification(
            "Product could not be found."
        );

        return;

    }


    if (
        Number(product.stock) <= 0
    ) {

        showNotification(
            "This product is out of stock."
        );

        return;

    }


    quantity =
        Math.max(
            1,
            Number(quantity) || 1
        );


    /* ---------------------------------------------------------
       LOGGED-IN USER → DJANGO CART
       --------------------------------------------------------- */

    if (isLoggedIn()) {

        try {

            await apiFetch(
                "/cart/add/",
                {
                    method: "POST",

                    body:
                        JSON.stringify({

                            product_id:
                                Number(product.id),

                            quantity

                        })
                }
            );


            await loadCartFromAPI();


            showNotification(
                `${product.name} added to cart.`
            );


            return;

        } catch (error) {

            console.error(
                "Django cart error:",
                error
            );


            showNotification(
                error.message ||
                "Could not add product to cart."
            );


            return;

        }

    }


    /* ---------------------------------------------------------
       GUEST USER → LOCAL CART
       --------------------------------------------------------- */

    const existingItem =
        cart.find(
            item =>
                String(item.id) ===
                String(product.id)
        );


    if (existingItem) {

        existingItem.quantity +=
            quantity;

    } else {

        cart.push({

            id:
                product.id,

            name:
                product.name,

            price:
                Number(product.price) || 0,

            image:
                product.image,

            category:
                product.category,

            quantity

        });

    }


    saveCart();

    updateCartCount();

    renderCart();

    renderCheckoutSummary();


    showNotification(
        `${product.name} added to cart.`
    );


    console.log(
        "Guest cart updated:",
        cart
    );

}


/* =========================================================
   20. LOAD CART FROM DJANGO
   ========================================================= */

async function loadCartFromAPI() {

    if (!isLoggedIn()) {

        return;

    }


    try {

        const data =
            await apiFetch(
                "/cart/"
            );


        const backendItems =
            Array.isArray(data?.items)
                ? data.items
                : [];


        cart =
            backendItems.map(
                item => {

                    const product =
                        item.product || {};


                    return {

                        id:
                            product.id ??
                            item.product_id,

                        name:
                            product.name ||
                            "Product",

                        price:
                            Number(
                                item.price ??
                                product.price
                            ) || 0,

                        image:
                            product.image ||
                            "",

                        category:
                            product.category ||
                            "General",

                        quantity:
                            Number(
                                item.quantity
                            ) || 1

                    };

                }
            );


        saveCart();

        renderCart();

        renderCheckoutSummary();

        updateCartCount();


        console.log(
            "Cart received from Django:",
            cart
        );

    } catch (error) {

        console.error(
            "Django cart loading error:",
            error
        );

    }

}


/* =========================================================
   21. UPDATE CART ITEM — API
   ========================================================= */

async function updateCartItemAPI(
    productId,
    quantity
) {

    try {

        await apiFetch(
            "/cart/update/",
            {
                method: "PATCH",

                body:
                    JSON.stringify({

                        product_id:
                            Number(productId),

                        quantity:
                            Number(quantity)

                    })
            }
        );


        await loadCartFromAPI();

    } catch (error) {

        console.error(
            "Cart update API error:",
            error
        );


        showNotification(
            error.message ||
            "Cart update failed."
        );

    }

}


/* =========================================================
   22. REMOVE CART ITEM — API
   ========================================================= */

async function removeCartItemAPI(
    productId
) {

    try {

        await apiFetch(
            "/cart/remove/",
            {
                method: "DELETE",

                body:
                    JSON.stringify({

                        product_id:
                            Number(productId)

                    })
            }
        );


        await loadCartFromAPI();


        showNotification(
            "Product removed from cart."
        );

    } catch (error) {

        console.error(
            "Cart remove API error:",
            error
        );


        showNotification(
            error.message ||
            "Could not remove product."
        );

    }

}


/* =========================================================
   23. UPDATE CART COUNT
   ========================================================= */

function updateCartCount() {

    const cartCount =
        document.querySelector(
            "#cart-count"
        );


    if (!cartCount) {

        return;

    }


    const count =
        cart.reduce(
            (total, item) =>
                total +
                Number(item.quantity),

            0
        );


    cartCount.textContent =
        count;

}


/* =========================================================
   24. CART RENDERING
   ========================================================= */

function renderCart() {

    const container =
        document.querySelector(
            ".cart-items"
        );


    if (!container) {

        return;

    }


    if (cart.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <h3>
                    Your cart is empty
                </h3>

                <p>
                    Add some products from
                    the collection to start shopping.
                </p>

            </div>

        `;


        updateCartSummary();

        return;

    }


    container.innerHTML =
        cart
            .map(createCartItem)
            .join("");


    updateCartSummary();

}


/* =========================================================
   25. CART ITEM
   ========================================================= */

function createCartItem(item) {

    const total =
        Number(item.price) *
        Number(item.quantity);


    return `

        <div
            class="cart-item"
            data-cart-id="${escapeHTML(item.id)}"
        >

            <img
                src="${escapeHTML(item.image)}"
                alt="${escapeHTML(item.name)}"
            >


            <div class="cart-item-info">

                <h4>
                    ${escapeHTML(item.name)}
                </h4>

                <p>
                    ${escapeHTML(item.category)}
                </p>

                <div class="cart-item-price">
                    ${formatPKR(total)}
                </div>

            </div>


            <div class="cart-item-controls">

                <button
                    type="button"
                    data-cart-action="decrease"
                >
                    −
                </button>


                <span>
                    ${item.quantity}
                </span>


                <button
                    type="button"
                    data-cart-action="increase"
                >
                    +
                </button>


                <button
                    type="button"
                    class="cart-remove"
                    data-cart-action="remove"
                    aria-label="Remove product"
                >
                    ×
                </button>

            </div>

        </div>

    `;

}


/* =========================================================
   26. CART EVENTS
   ========================================================= */

function setupCartEvents() {

    const cartContainer =
        document.querySelector(
            ".cart-items"
        );


    if (!cartContainer) {

        return;

    }


    cartContainer.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "button"
                );


            if (!button) {

                return;

            }


            const cartItem =
                button.closest(
                    ".cart-item"
                );


            if (!cartItem) {

                return;

            }


            const productId =
                cartItem.dataset.cartId;


            const action =
                button.dataset.cartAction;


            const item =
                cart.find(
                    cartItem =>
                        String(
                            cartItem.id
                        ) ===
                        String(productId)
                );


            if (!item) {

                return;

            }


            if (
                action ===
                "increase"
            ) {

                await changeCartQuantity(
                    productId,
                    1
                );

            }


            if (
                action ===
                "decrease"
            ) {

                await changeCartQuantity(
                    productId,
                    -1
                );

            }


            if (
                action ===
                "remove"
            ) {

                await removeFromCart(
                    productId
                );

            }

        }
    );

}


/* =========================================================
   27. CHANGE CART QUANTITY
   ========================================================= */

async function changeCartQuantity(
    productId,
    amount
) {

    const item =
        cart.find(
            cartItem =>
                String(
                    cartItem.id
                ) ===
                String(productId)
        );


    if (!item) {

        return;

    }


    const newQuantity =
        Number(item.quantity) +
        Number(amount);


    if (isLoggedIn()) {

        if (newQuantity <= 0) {

            await removeCartItemAPI(
                productId
            );

        } else {

            await updateCartItemAPI(
                productId,
                newQuantity
            );

        }

        return;

    }


    item.quantity =
        newQuantity;


    if (
        item.quantity <= 0
    ) {

        cart =
            cart.filter(
                cartItem =>
                    String(
                        cartItem.id
                    ) !==
                    String(productId)
            );

    }


    saveCart();

    renderCart();

    renderCheckoutSummary();

    updateCartCount();

}


/* =========================================================
   28. REMOVE FROM CART
   ========================================================= */

async function removeFromCart(
    productId
) {

    const removed =
        cart.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (isLoggedIn()) {

        await removeCartItemAPI(
            productId
        );

        return;

    }


    cart =
        cart.filter(
            item =>
                String(item.id) !==
                String(productId)
        );


    saveCart();

    renderCart();

    renderCheckoutSummary();

    updateCartCount();


    if (removed) {

        showNotification(
            `${removed.name} removed from cart.`
        );

    }

}


/* =========================================================
   29. CART SUMMARY
   ========================================================= */

function calculateCartSummary() {

    const subtotal =
        cart.reduce(
            (total, item) =>
                total +
                (
                    Number(item.price) *
                    Number(item.quantity)
                ),

            0
        );


    const shipping =
        cart.length > 0
            ? CONFIG.shipping
            : 0;


    const tax =
        subtotal *
        CONFIG.taxRate;


    const total =
        subtotal +
        shipping +
        tax;


    return {
        subtotal,
        shipping,
        tax,
        total
    };

}


/* =========================================================
   30. UPDATE CART SUMMARY
   ========================================================= */

function updateCartSummary() {

    const summary =
        calculateCartSummary();


    const subtotal =
        document.querySelector(
            "#cart-subtotal"
        );


    const shipping =
        document.querySelector(
            "#cart-shipping"
        );


    const tax =
        document.querySelector(
            "#cart-tax"
        );


    const total =
        document.querySelector(
            "#cart-total"
        );


    if (subtotal) {

        subtotal.textContent =
            formatPKR(
                summary.subtotal
            );

    }


    if (shipping) {

        shipping.textContent =
            formatPKR(
                summary.shipping
            );

    }


    if (tax) {

        tax.textContent =
            formatPKR(
                summary.tax
            );

    }


    if (total) {

        total.textContent =
            formatPKR(
                summary.total
            );

    }

}


/* =========================================================
   31. PRODUCT DETAILS
   ========================================================= */

function setupProductDetailsEvents() {

    const addButton =
        document.querySelector(
            "#details-add-cart"
        );


    const buyButton =
        document.querySelector(
            "#buy-now"
        );


    const quantityInput =
        document.querySelector(
            "#quantity"
        );


    const minusButton =
        document.querySelector(
            "#quantity-minus"
        );


    const plusButton =
        document.querySelector(
            "#quantity-plus"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            async () => {

                if (!selectedProduct) {

                    showNotification(
                        "Please select a product first."
                    );

                    return;

                }


                const quantity =
                    getDetailsQuantity();


                await addToCart(
                    selectedProduct.id,
                    quantity
                );

            }
        );

    }


    if (buyButton) {

        buyButton.addEventListener(
            "click",
            async () => {

                if (!selectedProduct) {

                    showNotification(
                        "Please select a product first."
                    );

                    return;

                }


                const quantity =
                    getDetailsQuantity();


                await addToCart(
                    selectedProduct.id,
                    quantity
                );


                scrollToSection(
                    "#checkout"
                );

            }
        );

    }


    if (minusButton) {

        minusButton.addEventListener(
            "click",
            () => {

                if (!quantityInput) {

                    return;

                }


                const current =
                    Number(
                        quantityInput.value
                    ) || 1;


                quantityInput.value =
                    Math.max(
                        1,
                        current - 1
                    );

            }
        );

    }


    if (plusButton) {

        plusButton.addEventListener(
            "click",
            () => {

                if (!quantityInput) {

                    return;

                }


                const current =
                    Number(
                        quantityInput.value
                    ) || 1;


                quantityInput.value =
                    Math.min(
                        99,
                        current + 1
                    );

            }
        );

    }

}


/* =========================================================
   32. SHOW PRODUCT DETAILS
   ========================================================= */

function showProductDetails(
    productId
) {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!product) {

        showNotification(
            "Product details unavailable."
        );

        return;

    }


    selectedProduct =
        product;


    const section =
        document.querySelector(
            "#product-details"
        );


    const image =
        document.querySelector(
            "#details-image"
        );


    const category =
        document.querySelector(
            "#details-category"
        );


    const name =
        document.querySelector(
            "#details-name"
        );


    const description =
        document.querySelector(
            "#details-description"
        );


    const price =
        document.querySelector(
            "#details-price"
        );


    const quantity =
        document.querySelector(
            "#quantity"
        );


    if (image) {

        image.src =
            product.image;

        image.alt =
            product.name;

    }


    if (category) {

        category.textContent =
            product.category;

    }


    if (name) {

        name.textContent =
            product.name;

    }


    if (description) {

        description.textContent =
            product.description;

    }


    if (price) {

        price.textContent =
            formatPKR(
                product.price
            );

    }


    if (quantity) {

        quantity.value =
            1;

    }


    if (section) {

        section.style.display =
            "block";


        setTimeout(
            () => {

                section.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            },
            50
        );

    }


    console.log(
        "Selected product:",
        product
    );

}


/* =========================================================
   33. DETAILS QUANTITY
   ========================================================= */

function getDetailsQuantity() {

    const quantityInput =
        document.querySelector(
            "#quantity"
        );


    if (!quantityInput) {

        return 1;

    }


    const quantity =
        Number(
            quantityInput.value
        );


    return Math.min(
        99,
        Math.max(
            1,
            Number.isFinite(
                quantity
            )
                ? quantity
                : 1
        )
    );

}


/* =========================================================
   34. CHECKOUT
   ========================================================= */

function setupCheckout() {

    const checkoutButton =
        document.querySelector(
            "#checkout-button"
        );


    const checkoutForm =
        document.querySelector(
            "#checkout-form"
        );


    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            () => {

                if (
                    cart.length === 0
                ) {

                    showNotification(
                        "Your cart is empty."
                    );

                    return;

                }


                renderCheckoutSummary();


                scrollToSection(
                    "#checkout"
                );

            }
        );

    }


    if (checkoutForm) {

        checkoutForm.addEventListener(
            "submit",
            handleCheckout
        );

    }

}


/* =========================================================
   35. CHECKOUT SUMMARY
   ========================================================= */

function renderCheckoutSummary() {

    const container =
        document.querySelector(
            "#checkout-items"
        );


    if (!container) {

        return;

    }


    if (
        cart.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <h3>
                    No items
                </h3>

                <p>
                    Your checkout summary is empty.
                </p>

            </div>

        `;

    } else {

        container.innerHTML =
            cart
                .map(
                    item => {

                        const itemTotal =
                            Number(
                                item.price
                            ) *
                            Number(
                                item.quantity
                            );


                        return `

                            <div class="checkout-item">

                                <div class="checkout-item-info">

                                    <img
                                        src="${escapeHTML(item.image)}"
                                        alt="${escapeHTML(item.name)}"
                                    >

                                    <div>

                                        <strong>
                                            ${escapeHTML(item.name)}
                                        </strong>

                                        <span>
                                            Qty:
                                            ${item.quantity}
                                        </span>

                                    </div>

                                </div>


                                <strong>
                                    ${formatPKR(itemTotal)}
                                </strong>

                            </div>

                        `;

                    }
                )
                .join("");

    }


    const summary =
        calculateCartSummary();


    const subtotal =
        document.querySelector(
            "#checkout-subtotal"
        );


    const tax =
        document.querySelector(
            "#checkout-tax"
        );


    const total =
        document.querySelector(
            "#checkout-total"
        );


    if (subtotal) {

        subtotal.textContent =
            formatPKR(
                summary.subtotal
            );

    }


    if (tax) {

        tax.textContent =
            formatPKR(
                summary.tax
            );

    }


    if (total) {

        total.textContent =
            formatPKR(
                summary.total
            );

    }

}


/* =========================================================
   36. PLACE ORDER — DJANGO API
   ========================================================= */

async function handleCheckout(
    event
) {

    event.preventDefault();


    if (
        cart.length === 0
    ) {

        showNotification(
            "Your cart is empty."
        );

        return;

    }


    /* ---------------------------------------------------------
       LOGIN REQUIRED
       --------------------------------------------------------- */

    if (!isLoggedIn()) {

        showNotification(
            "Please login before placing your order."
        );


        openLoginModal();


        return;

    }


    const name =
        document.querySelector(
            "#checkout-name"
        )?.value.trim();


    const email =
        document.querySelector(
            "#checkout-email"
        )?.value.trim();


    const phone =
        document.querySelector(
            "#checkout-phone"
        )?.value.trim();


    const address =
        document.querySelector(
            "#checkout-address"
        )?.value.trim();


    const payment =
        document.querySelector(
            "#payment-method"
        )?.value;


    if (
        !name ||
        !email ||
        !phone ||
        !address ||
        !payment
    ) {

        showNotification(
            "Please complete all checkout fields."
        );

        return;

    }


    try {

        console.log(
            "Sending order to Django..."
        );


        const order =
            await apiFetch(
                "/orders/",
                {
                    method: "POST",

                    body:
                        JSON.stringify({

                            customer_name:
                                name,

                            email:
                                email,

                            phone:
                                phone,

                            address:
                                address,

                            payment_method:
                                payment

                        })
                }
            );


        console.log(
            "Order created by Django:",
            order
        );


        cart = [];


        saveCart();


        updateCartCount();

        renderCart();

        renderCheckoutSummary();


        await loadProductsFromAPI();

        await loadOrdersFromAPI();


        const checkoutForm =
            document.querySelector(
                "#checkout-form"
            );


        if (checkoutForm) {

            checkoutForm.reset();

        }


        showNotification(
            `Order ${
                order.order_number ||
                order.id ||
                ""
            } placed successfully.`
        );


        scrollToSection(
            "#orders"
        );


    } catch (error) {

        console.error(
            "Order API Error:",
            error
        );


        showNotification(
            error.message ||
            "Order could not be created."
        );

    }

}


/* =========================================================
   37. LOAD ORDERS FROM DJANGO
   ========================================================= */

async function loadOrdersFromAPI() {

    if (!isLoggedIn()) {

        return;

    }


    try {

        const data =
            await apiFetch(
                "/orders/"
            );


        orders =
            Array.isArray(data)
                ? data
                : Array.isArray(
                    data.results
                )
                    ? data.results
                    : [];


        console.log(
            "Orders received from Django:",
            orders
        );


        renderOrders();

    } catch (error) {

        console.error(
            "Orders API error:",
            error
        );

    }

}


/* =========================================================
   38. RENDER ORDERS
   ========================================================= */

function renderOrders() {

    const container =
        document.querySelector(
            "#orders-container"
        );


    if (!container) {

        return;

    }


    if (
        orders.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <h3>
                    No orders yet
                </h3>

                <p>
                    Your completed orders
                    will appear here.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        orders
            .map(
                createOrderCard
            )
            .join("");

}


/* =========================================================
   39. ORDER CARD
   ========================================================= */

function createOrderCard(
    order
) {

    const items =
        Array.isArray(
            order.items
        )
            ? order.items
            : [];


    const itemCount =
        items.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.quantity || 0
                ),
            0
        );


    const orderNumber =
        order.order_number ||
        order.id ||
        "NEXORA ORDER";


    const date =
        order.created_at
            ? new Date(
                order.created_at
            ).toLocaleString(
                "en-PK"
            )
            : "N/A";


    return `

        <article class="order-card">

            <div class="order-header">

                <div>

                    <strong>
                        ${escapeHTML(
                            orderNumber
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            date
                        )}
                    </span>

                </div>


                <span class="order-status">
                    ${escapeHTML(
                        order.status ||
                        "pending"
                    )}
                </span>

            </div>


            <div class="order-body">

                <p>

                    ${itemCount}
                    item${itemCount === 1 ? "" : "s"}

                    ·

                    ${escapeHTML(
                        order.payment_method ||
                        order.payment ||
                        "Payment"
                    )}

                </p>


                <div class="order-total">

                    ${formatPKR(
                        order.total
                    )}

                </div>

            </div>


            ${
                order.status === "pending"
                    ? `
                        <button
                            type="button"
                            class="cancel-order-btn"
                            data-order-id="${order.id}"
                        >
                            Cancel Order
                        </button>
                    `
                    : ""
            }

        </article>

    `;

}


/* =========================================================
   40. CANCEL ORDER
   ========================================================= */

async function cancelOrder(
    orderId
) {

    if (!isLoggedIn()) {

        return;

    }


    try {

        await apiFetch(
            `/orders/${orderId}/cancel/`,
            {
                method: "POST"
            }
        );


        showNotification(
            "Order cancelled successfully."
        );


        await loadOrdersFromAPI();

        await loadProductsFromAPI();


    } catch (error) {

        console.error(
            "Cancel order error:",
            error
        );


        showNotification(
            error.message ||
            "Order cancellation failed."
        );

    }

}


/* =========================================================
   41. CURRENT USER / PROFILE
   ========================================================= */

async function loadCurrentUser() {

    if (!isLoggedIn()) {

        currentUser = null;

        return;

    }


    try {

        currentUser =
            await apiFetch(
                "/auth/profile/"
            );


        console.log(
            "Current Django user:",
            currentUser
        );

    } catch (error) {

        console.error(
            "Profile API error:",
            error
        );


        clearToken();

        currentUser = null;

    }

}


/* =========================================================
   42. LOGIN — DJANGO
   ========================================================= */

async function handleLogin(
    event
) {

    event.preventDefault();


    const email =
        document.querySelector(
            "#login-email"
        )?.value.trim();


    const password =
        document.querySelector(
            "#login-password"
        )?.value;


    if (
        !email ||
        !password
    ) {

        showNotification(
            "Please enter your email and password."
        );

        return;

    }


    try {

        /*
         IMPORTANT:
         Backend login currently expects username.
         We send the entered email as username.
        */

        const data =
            await apiFetch(
                "/auth/login/",
                {
                    method: "POST",

                    body:
                        JSON.stringify({

                            username:
                                email,

                            password

                        })
                }
            );


        if (!data.token) {

            throw new Error(
                "Login token was not returned by Django."
            );

        }


        saveToken(
            data.token
        );


        currentUser =
            data.user ||
            null;


        closeLoginModal();


        event.target.reset();


        showNotification(
            "Login successful."
        );


        await loadCurrentUser();

        await loadCartFromAPI();

        await loadOrdersFromAPI();


    } catch (error) {

        console.error(
            "Login API error:",
            error
        );


        showNotification(
            error.message ||
            "Login failed."
        );

    }

}


/* =========================================================
   43. REGISTER — DJANGO
   ========================================================= */

async function handleRegister(
    event
) {

    event.preventDefault();


    const name =
        document.querySelector(
            "#register-name"
        )?.value.trim();


    const email =
        document.querySelector(
            "#register-email"
        )?.value.trim();


    const password =
        document.querySelector(
            "#register-password"
        )?.value;


    if (
        !name ||
        !email ||
        !password
    ) {

        showNotification(
            "Please complete all registration fields."
        );

        return;

    }


    try {

        /*
         Backend RegisterSerializer expects:
         username
         email
         password
         password2
        */

        const data =
            await apiFetch(
                "/auth/register/",
                {
                    method: "POST",

                    body:
                        JSON.stringify({

                            username:
                                name,

                            email,

                            password,

                            password2:
                                password

                        })
                }
            );


        if (data.token) {

            saveToken(
                data.token
            );

        }


        currentUser =
            data.user ||
            null;


        event.target.reset();


        closeRegisterModal();


        showNotification(
            "Account created successfully."
        );


        if (
            !isLoggedIn()
        ) {

            setTimeout(
                openLoginModal,
                500
            );

        } else {

            await loadCurrentUser();

            await loadCartFromAPI();

            await loadOrdersFromAPI();

        }


    } catch (error) {

        console.error(
            "Register API error:",
            error
        );


        showNotification(
            error.message ||
            "Registration failed."
        );

    }

}


/* =========================================================
   44. LOGOUT — DJANGO
   ========================================================= */

async function logoutUser() {

    try {

        if (isLoggedIn()) {

            await apiFetch(
                "/auth/logout/",
                {
                    method: "POST"
                }
            );

        }

    } catch (error) {

        console.warn(
            "Logout API error:",
            error
        );

    } finally {

        clearToken();

        currentUser = null;

        cart = [];

        orders = [];

        renderCart();

        renderCheckoutSummary();

        renderOrders();

        updateCartCount();


        showNotification(
            "Logged out successfully."
        );

    }

}


/* =========================================================
   45. NAVIGATION
   ========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(
            'a[href^="#"]'
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    event => {

                        const targetId =
                            link.getAttribute(
                                "href"
                            );


                        if (
                            !targetId ||
                            targetId === "#"
                        ) {

                            return;

                        }


                        const target =
                            document.querySelector(
                                targetId
                            );


                        if (!target) {

                            return;

                        }


                        event.preventDefault();


                        target.scrollIntoView({
                            behavior:
                                "smooth",
                            block:
                                "start"
                        });

                    }
                );

            }
        );


    const cartButton =
        document.querySelector(
            ".nav-cart-btn"
        );


    if (cartButton) {

        cartButton.addEventListener(
            "click",
            () => {

                scrollToSection(
                    "#cart"
                );

            }
        );

    }


    const loginButton =
        document.querySelector(
            ".nav-login-btn"
        );


    if (loginButton) {

        loginButton.addEventListener(
            "click",
            () => {

                if (
                    isLoggedIn()
                ) {

                    logoutUser();

                } else {

                    openLoginModal();

                }

            }
        );

    }

}


/* =========================================================
   46. SCROLL
   ========================================================= */

function scrollToSection(
    selector
) {

    const section =
        document.querySelector(
            selector
        );


    if (!section) {

        return;

    }


    section.scrollIntoView({
        behavior:
            "smooth",
        block:
            "start"
    });

}


/* =========================================================
   47. AUTHENTICATION SETUP
   ========================================================= */

function setupAuthentication() {

    const loginModal =
        document.querySelector(
            "#login-modal"
        );


    const registerModal =
        document.querySelector(
            "#register-modal"
        );


    const loginClose =
        document.querySelector(
            "#login-close"
        );


    const registerClose =
        document.querySelector(
            "#register-close"
        );


    const openRegister =
        document.querySelector(
            "#open-register"
        );


    const openLogin =
        document.querySelector(
            "#open-login"
        );


    const loginForm =
        document.querySelector(
            "#login-form"
        );


    const registerForm =
        document.querySelector(
            "#register-form"
        );


    if (loginClose) {

        loginClose.addEventListener(
            "click",
            closeLoginModal
        );

    }


    if (registerClose) {

        registerClose.addEventListener(
            "click",
            closeRegisterModal
        );

    }


    if (openRegister) {

        openRegister.addEventListener(
            "click",
            () => {

                closeLoginModal();

                openRegisterModal();

            }
        );

    }


    if (openLogin) {

        openLogin.addEventListener(
            "click",
            () => {

                closeRegisterModal();

                openLoginModal();

            }
        );

    }


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            handleRegister
        );

    }


    [loginModal, registerModal]
        .forEach(
            modal => {

                if (!modal) {

                    return;

                }


                modal.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target ===
                            modal
                        ) {

                            modal.classList.remove(
                                "active"
                            );

                            document.body.classList.remove(
                                "modal-open"
                            );

                        }

                    }
                );

            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeLoginModal();

                closeRegisterModal();

            }

        }
    );

}


/* =========================================================
   48. LOGIN MODAL
   ========================================================= */

function openLoginModal() {

    const modal =
        document.querySelector(
            "#login-modal"
        );


    if (!modal) {

        return;

    }


    modal.classList.add(
        "active"
    );


    document.body.classList.add(
        "modal-open"
    );

}


function closeLoginModal() {

    const modal =
        document.querySelector(
            "#login-modal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }


    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   49. REGISTER MODAL
   ========================================================= */

function openRegisterModal() {

    const modal =
        document.querySelector(
            "#register-modal"
        );


    if (!modal) {

        return;

    }


    modal.classList.add(
        "active"
    );


    document.body.classList.add(
        "modal-open"
    );

}


function closeRegisterModal() {

    const modal =
        document.querySelector(
            "#register-modal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }


    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   50. CONTACT FORM
   ========================================================= */

function setupContactForm() {

    const form =
        document.querySelector(
            "#contact-form"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const name =
                document.querySelector(
                    "#contact-name"
                )?.value.trim();


            const email =
                document.querySelector(
                    "#contact-email"
                )?.value.trim();


            const message =
                document.querySelector(
                    "#contact-message"
                )?.value.trim();


            if (
                !name ||
                !email ||
                !message
            ) {

                showNotification(
                    "Please complete all contact fields."
                );

                return;

            }


            form.reset();


            showNotification(
                "Your message has been received. Thank you!"
            );

        }
    );

}


/* =========================================================
   51. NOTIFICATION
   ========================================================= */

let notificationTimer = null;


function showNotification(
    message
) {

    const notification =
        document.querySelector(
            "#notification"
        );


    if (!notification) {

        console.log(
            message
        );

        return;

    }


    notification.textContent =
        message;


    notification.classList.add(
        "show"
    );


    clearTimeout(
        notificationTimer
    );


    notificationTimer =
        setTimeout(
            () => {

                notification.classList.remove(
                    "show"
                );

            },
            2800
        );

}


/* =========================================================
   52. IMAGE FALLBACK
   ========================================================= */

function setupImageFallback() {

    document
        .querySelectorAll(
            "img"
        )
        .forEach(
            image => {

                if (
                    image.dataset.fallbackReady
                ) {

                    return;

                }


                image.dataset.fallbackReady =
                    "true";


                image.addEventListener(
                    "error",
                    () => {

                        image.src =
                            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80";

                    }
                );

            }
        );

}


/* =========================================================
   53. DEBUG
   ========================================================= */

function nexoraDebug() {

    console.log(
        "===================================="
    );

    console.log(
        "NEXORA DEBUG"
    );

    console.log(
        "===================================="
    );

    console.log(
        "API:",
        CONFIG.apiBaseUrl
    );

    console.log(
        "Token:",
        getToken()
    );

    console.log(
        "Logged In:",
        isLoggedIn()
    );

    console.log(
        "Current User:",
        currentUser
    );

    console.log(
        "Products:",
        products
    );

    console.log(
        "Visible Products:",
        currentProducts
    );

    console.log(
        "Cart:",
        cart
    );

    console.log(
        "Cart Summary:",
        calculateCartSummary()
    );

    console.log(
        "Orders:",
        orders
    );

    console.log(
        "===================================="
    );

}


/* =========================================================
   54. GLOBAL NEXORA DEBUG OBJECT
   ========================================================= */

window.NEXORA = {

    getProducts:
        () => products,

    getCart:
        () => cart,

    getOrders:
        () => orders,

    getUser:
        () => currentUser,

    getToken:
        () => getToken(),

    isLoggedIn:
        () => isLoggedIn(),

    addToCart,

    removeFromCart,

    showProductDetails,

    calculateCartSummary,

    loadProductsFromAPI,

    loadCartFromAPI,

    loadOrdersFromAPI,

    debug:
        nexoraDebug

};


/* =========================================================
   55. FINAL LOG
   ========================================================= */

console.log(
    "%cNEXORA JS loaded successfully.",
    "font-weight:bold;font-size:14px;"
);

console.log(
    "Frontend + Django API integration enabled."
);

console.log(
    "Run NEXORA.debug() for diagnostics."
);
