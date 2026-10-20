let allProducts = [];
let cart = JSON.parse(localStorage.getItem("vibeCart")) || [];
let wishlist = JSON.parse(localStorage.getItem("vibeWishlist")) || [];
let currentProduct = null;
let productModal = null;

document.addEventListener("DOMContentLoaded", () => {
    productModal = new bootstrap.Modal(document.getElementById('productModal'));
    apis();
    updateCartBadge();
    updateWishlistBadge();
});

// Fetch products from API..............................................................
function apis() {
    const categoryFiltersContainer = document.getElementById("category-filters");
    if (!categoryFiltersContainer) return;

    fetch("https://dummyjson.com/products?limit=200")
        .then((res) => res.json())
        .then((data) => {
            allProducts = data.products;

            const categories = [...new Set(allProducts.map(p => p.category))];
            categoryFiltersContainer.innerHTML = categories.map(cat => `
                <div class="form-check">
                    <input class="form-check-input category-checkbox" type="checkbox" value="${cat}" id="cat-${cat}" checked>
                    <label class="form-check-label text-capitalize small" for="cat-${cat}">
                        ${cat.replace('-', ' ')}
                    </label>
                </div>
            `).join("");

            renderProducts(allProducts);

            document.querySelectorAll('.category-checkbox').forEach(cb => {
                cb.addEventListener('change', filterProducts);
            });
        })
        .catch((error) => console.error("Error fetching data:", error));
}

// Filter products based on selected checkboxes........................
function filterProducts() {
    const selectedCategories = Array.from(document.querySelectorAll('.category-checkbox:checked'))
        .map(cb => cb.value);

    const filtered = allProducts.filter(p => selectedCategories.includes(p.category));
    renderProducts(filtered);
}

// Render Product Cards................................
function renderProducts(productsToRender) {
    const mycard = document.getElementById("carddata");
    if (!mycard) return;

    if (productsToRender.length === 0) {
        mycard.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-box-seam display-1 text-muted"></i>
                <p class="text-muted mt-3">No products found for selected categories.</p>
            </div>`;
        return;
    }

    mycard.innerHTML = productsToRender.map((d) => {
        const isWishlisted = wishlist.some(item => item.id === d.id);
        return `
            <div class="col">
                <div class="card product-card h-100 border-0 shadow-sm overflow-hidden" onclick="openProductModal(${d.id})" style="cursor: pointer;">
                    <!-- Image Container -->
                    <div class="product-img-wrapper position-relative overflow-hidden bg-white d-flex align-items-center justify-content-center" style="height: 220px;">
                        <img src="${d.thumbnail}" class="product-img w-100 h-100" alt="${d.title}" style="object-fit: contain; transition: transform 0.4s ease;">
                        
                        <!-- Overlay Hover Actions -->
                        <div class="product-overlay position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center gap-2" 
                             style="background: rgba(0, 0, 0, 0.3); opacity: 0; transition: opacity 0.3s ease;">
                            <button class="btn ${isWishlisted ? 'btn-danger' : 'btn-light'} rounded-circle shadow action-btn" title="Toggle Wishlist" onclick="event.stopPropagation(); toggleWishlist(${d.id})">
                                <i class="fa ${isWishlisted ? 'fa-heart' : 'fa-heart-o'}" aria-hidden="true"></i> 
                            </button>
                            <button class="btn btn-primary rounded-circle shadow action-btn" title="Add to Cart" onclick="event.stopPropagation(); addToCart(${d.id})">
                                <i class="fa fa-shopping-bag" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Card Body -->
                    <div class="card-body d-flex flex-column p-3">
                        <span class="badge bg-light text-secondary text-uppercase border mb-2 align-self-start small">${d.category}</span>
                        <h6 class="card-title text-truncate fw-bold text-dark mb-1" title="${d.title}">${d.title}</h6>
                        
                        <!-- Rating -->
                        <div class="d-flex align-items-center mb-3">
                            <span class="text-warning me-1 small"><i class="fa fa-star"></i></span>
                            <span class="fw-bold small me-1">${d.rating}</span>
                            <span class="text-muted small">(${d.reviews ? d.reviews.length : 12})</span>
                        </div>

                        <div class="mt-auto d-flex justify-content-between align-items-center">
                            <p class="fw-bold text-primary fs-5 mb-0">$${d.price}</p>
                            <button class="btn btn-primary btn-sm rounded-pill px-3 shadow-sm" onclick="event.stopPropagation(); openProductModal(${d.id})">
                                Shop Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// Add Product to Cart & Update Badge............................................
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            cart.push({...product, quantity: 1 });
        }
        localStorage.setItem("vibeCart", JSON.stringify(cart));
        updateCartBadge();
        showToastNotification("Product added to cart successfully!");
    }
}

// Toggle Wishlist Item........................................................
function toggleWishlist(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const index = wishlist.findIndex(item => item.id === productId);
    if (index > -1) {
        wishlist.splice(index, 1);
        showToastNotification("Removed from wishlist.");
    } else {
        wishlist.push(product);
        showToastNotification("Added to wishlist!");
    }
    localStorage.setItem("vibeWishlist", JSON.stringify(wishlist));
    updateWishlistBadge();
    renderProducts(allProducts); // Re-render to update heart icon colors
}

// Update Cart Badge Count...................................................
function updateCartBadge() {
    const badge = document.querySelector('a[href="cart.html"] .badge');
    if (badge) {
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        badge.innerText = totalItems;
        badge.style.display = totalItems > 0 ? "inline-block" : "none";
    }
}

// Update Wishlist Badge Count.........................................................
function updateWishlistBadge() {
    const badge = document.querySelector('a[href="wishlist.html"] .badge');
    if (badge) {
        badge.innerText = wishlist.length;
        badge.style.display = wishlist.length > 0 ? "inline-block" : "none";
    }
}

// Open Modal with Product Details........................................................
function openProductModal(productId) {
    currentProduct = allProducts.find(p => p.id === productId);
    if (!currentProduct) return;

    const modalBody = document.getElementById("modal-body-content");
    modalBody.innerHTML = `
        <div class="row g-4 align-items-center">
            <div class="col-md-6 text-center">
                <div class="bg-light p-3 rounded-4">
                    <img src="${currentProduct.images ? currentProduct.images[0] : currentProduct.thumbnail}" class="img-fluid rounded" style="max-height: 300px; object-fit: contain;">
                </div>
            </div>
            <div class="col-md-6">
                <span class="badge bg-primary-subtle text-primary text-uppercase mb-2">${currentProduct.category}</span>
                <h3 class="fw-bold text-dark mb-2">${currentProduct.title}</h3>
                <div class="d-flex align-items-center mb-3">
                    <span class="text-warning me-1"><i class="fa fa-star"></i></span>
                    <span class="fw-bold me-2">${currentProduct.rating}</span>
                    <span class="text-muted">(${currentProduct.brand || 'Brand'})</span>
                </div>
                <h2 class="text-primary fw-bold mb-3">$${currentProduct.price}</h2>
                <p class="text-muted small mb-4">${currentProduct.description || 'Behtareen quality aur offers ke sath uplabdh hai.'}</p>
                
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-primary rounded-pill px-4 flex-fill" onclick="addToCart(${currentProduct.id})">
                        <i class="fa fa-shopping-bag" aria-hidden="true"></i> Add to Cart
                    </button>
                    <button class="btn btn-primary rounded-pill px-4 flex-fill" onclick="showCheckoutForm()">
                        <i class="fa fa-bolt me-1"></i> Shop Now 
                    </button>
                </div>
            </div>
        </div>
    `;

    productModal.show();
}

function showCheckoutForm() {
    const modalBody = document.getElementById("modal-body-content");
    modalBody.innerHTML = `
        <div class="px-2 py-1">
            <h4 class="fw-bold text-dark mb-1">Enter Delivery Address</h4>
            <p class="text-muted small mb-4">Product: <strong>${currentProduct.title}</strong> ($${currentProduct.price})</p>
            
            <form onsubmit="handleOrderSubmit(event)">
                <div class="mb-3">
                    <label class="form-label fw-semibold small">Full Name</label>
                    <input type="text" class="form-control rounded-3" placeholder="Enter your Name...." required>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold small">Phone Number</label>
                    <input type="tel" class="form-control rounded-3" placeholder="Enter your phone..." required>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold small">Delivery Address</label>
                    <textarea class="form-control rounded-3" rows="3" placeholder="House No., Street, City, Pincode" required></textarea>
                </div>
                <div class="d-flex gap-2 pt-2">
                    <button type="button" class="btn btn-light rounded-pill flex-fill" onclick="openProductModal(${currentProduct.id})">Back</button>
                    <button type="submit" class="btn btn-success rounded-pill flex-fill fw-bold">Confirm Order</button>
                </div>
            </form>
        </div>
    `;
}

// Handle Order Success................................................................
function handleOrderSubmit(event) {
    event.preventDefault();
    const modalBody = document.getElementById("modal-body-content");

    modalBody.innerHTML = `
        <div class="text-center py-4">
            <div class="mb-3">
                <i class="fa fa-check-circle text-success" style="font-size: 60px;"></i>
            </div>
            <h3 class="fw-bold text-success mb-2">Order Successful!</h3>
            <p class="text-muted mb-4">Aapka order successfully place ho gaya hai.</p>
            <div class="alert alert-light border rounded-3 p-3 mb-4">
                <h5 class="fw-bold text-primary mb-0">Thank you for shopping with VibeCart!</h5>
            </div>
            <button class="btn btn-primary rounded-pill px-4" data-bs-dismiss="modal">Continue Shopping</button>
        </div>
    `;
}

// Simple Toast Notification Helper..............................................
function showToastNotification(message) {
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        toastContainer.style.cssText = "position: fixed; bottom: 20px; right: 20px; z-index: 1080;";
        document.body.appendChild(toastContainer);
    }

    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-bg-dark border-0 show mb-2" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close" onclick="document.getElementById('${toastId}').remove()"></button>
            </div>
        </div>
    `;
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);

    setTimeout(() => {
        const el = document.getElementById(toastId);
        if (el) el.remove();
    }, 3000);
}

//cart page.........................................
document.addEventListener("DOMContentLoaded", () => {
    renderCartPage();
});

// Render Items on Cart Page..............................................................
function renderCartPage() {
    const container = document.getElementById("cart-items-container");
    if (!container) return;

    let cart = JSON.parse(localStorage.getItem("vibeCart")) || [];

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="card border-0 shadow-sm text-center py-5 rounded-4">
                <i class="fa fa-shopping-bag display-1 text-muted mb-3"></i>
                <h4 class="fw-bold text-dark">Your Cart is Empty</h4>
                <p class="text-muted">Aapne abhi tak koi product add nahi kiya hai.</p>
                <div>
                    <a href="index.html" class="btn btn-primary rounded-pill px-4 mt-2">Shop Now</a>
                </div>
            </div>`;
        updateCartSummary(0);
        return;
    }

    let subtotal = 0;

    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * (item.quantity || 1);
        subtotal += itemTotal;

        return `
            <div class="card border-0 shadow-sm mb-3 rounded-4 overflow-hidden">
                <div class="card-body p-3">
                    <div class="row align-items-center g-3">
                        <!-- Image -->
                        <div class="col-3 col-md-2 text-center">
                            <img src="${item.thumbnail}" class="img-fluid rounded" style="height: 70px; object-fit: contain;" alt="${item.title}">
                        </div>
                        
                        <!-- Details -->
                        <div class="col-9 col-md-4">
                            <h6 class="fw-bold text-dark mb-1 text-truncate">${item.title}</h6>
                            <span class="badge bg-light text-secondary border text-uppercase">${item.category}</span>
                            <div class="text-primary fw-bold mt-1">$${item.price}</div>
                        </div>

                        <!-- Quantity Controls -->
                        <div class="col-6 col-md-3">
                            <div class="input-group input-group-sm">
                                <button class="btn btn-outline-secondary" onclick="changeQuantity(${item.id}, -1)">-</button>
                                <span class="form-control text-center fw-bold bg-white">${item.quantity || 1}</span>
                                <button class="btn btn-outline-secondary" onclick="changeQuantity(${item.id}, 1)">+</button>
                            </div>
                        </div>

                        <!-- Total & Remove -->
                        <div class="col-6 col-md-3 text-end">
                            <span class="fw-bold text-dark d-block mb-1">$${itemTotal.toFixed(2)}</span>
                            <button class="btn btn-link text-danger p-0 border-0" onclick="removeFromCart(${item.id})">
                                <i class="fa fa-trash me-1"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    updateCartSummary(subtotal);
}

// Change Item Quantity...........................................................
function changeQuantity(productId, delta) {
    let cart = JSON.parse(localStorage.getItem("vibeCart")) || [];
    const item = cart.find(p => p.id === productId);

    if (item) {
        item.quantity = (item.quantity || 1) + delta;
        if (item.quantity <= 0) {
            cart = cart.filter(p => p.id !== productId);
        }
        localStorage.setItem("vibeCart", JSON.stringify(cart));
        renderCartPage();
        updateCartBadge();
    }
}

// Remove Single Item...........................................................
function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem("vibeCart")) || [];
    cart = cart.filter(p => p.id !== productId);
    localStorage.setItem("vibeCart", JSON.stringify(cart));
    renderCartPage();
    updateCartBadge();
}

// Update Subtotal & Total............................................................
function updateCartSummary(subtotal) {
    const subtotalEl = document.getElementById("cart-subtotal");
    const totalEl = document.getElementById("cart-total");

    if (subtotalEl) subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.innerText = `$${subtotal.toFixed(2)}`;
}

// Open Checkout Form for All Cart Items....................................................
function proceedToCartCheckout() {
    let cart = JSON.parse(localStorage.getItem("vibeCart")) || [];
    if (cart.length === 0) {
        alert("cart is a null!");
        return;
    }

    const modalEl = new bootstrap.Modal(document.getElementById('cartCheckoutModal'));
    const modalBody = document.getElementById("cartModalBody");

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    modalBody.innerHTML = `
        <div class="p-2">
            <h4 class="fw-bold text-dark mb-1">Enter Delivery Address</h4>
            <p class="text-muted small mb-3">Total Payable Amount: <strong class="text-primary">$${totalAmount.toFixed(2)}</strong></p>
            
            <form onsubmit="confirmCartOrder(event, modalEl)">
                <div class="mb-3">
                    <label class="form-label fw-semibold small">Full Name</label>
                    <input type="text" class="form-control rounded-3" placeholder="Enter full name" required>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold small">Phone Number</label>
                    <input type="tel" class="form-control rounded-3" placeholder="Enter phone number" required>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold small">Delivery Address</label>
                    <textarea class="form-control rounded-3" rows="3" placeholder="House No., Street, City, Pincode" required></textarea>
                </div>
                <div class="d-flex gap-2 pt-2">
                    <button type="button" class="btn btn-light rounded-pill flex-fill" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-success rounded-pill flex-fill fw-bold">Place Order</button>
                </div>
            </form>
        </div>
    `;

    modalEl.show();
}

// Confirm Order & Clear Cart
function confirmCartOrder(event, modalInstance) {
    event.preventDefault();
    localStorage.removeItem("vibeCart");

    const modalBody = document.getElementById("cartModalBody");
    modalBody.innerHTML = `
        <div class="text-center py-4">
            <i class="fa fa-check-circle text-success mb-3" style="font-size: 60px;"></i>
            <h3 class="fw-bold text-success mb-2">Order Placed Successfully!</h3>
            <p class="text-muted mb-4">Aapka order successfully register ho gaya hai.</p>
            <button class="btn btn-primary rounded-pill px-4" onclick="window.location.href='index.html'">Continue Shopping</button>
        </div>
    `;

    updateCartBadge();
}
//wishlist page start....................................................
document.addEventListener("DOMContentLoaded", () => {
    renderWishlistPage();
});

function renderWishlistPage() {
    let wishlist = JSON.parse(localStorage.getItem("vibeWishlist")) || [];
    const container = document.getElementById("wishlist-container");

    if (wishlist.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fa fa-heart-o display-1 text-muted mb-3"></i>
                <h4 class="text-muted">Your wishlist is empty</h4>
                <a href="index.html" class="btn btn-primary mt-3">Explore Products</a>
            </div>`;
        return;
    }

    container.innerHTML = wishlist.map(d => `
        <div class="col">
            <div class="card h-100 border-0 shadow-sm overflow-hidden">
                <div class="position-relative bg-white d-flex align-items-center justify-content-center" style="height: 220px;">
                    <img src="${d.thumbnail}" class="w-100 h-100" alt="${d.title}" style="object-fit: contain;">
                    <button class="btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0 m-3 shadow" onclick="removeFromWishlist(${d.id})" title="Remove">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
                <div class="card-body d-flex flex-column p-3">
                    <h6 class="card-title text-truncate fw-bold text-dark mb-1">${d.title}</h6>
                    <p class="fw-bold text-primary fs-5 mb-3">$${d.price}</p>
                    <button class="mt-auto btn btn-primary btn-sm rounded-pill w-100" onclick="moveToCart(${d.id})">
                        Move to Bag
                    </button>
                </div>
            </div>
        </div>
    `).join("");
}

function removeFromWishlist(id) {
    let wishlist = JSON.parse(localStorage.getItem("vibeWishlist")) || [];
    wishlist = wishlist.filter(item => item.id !== id);
    localStorage.setItem("vibeWishlist", JSON.stringify(wishlist));
    renderWishlistPage();
}

function moveToCart(id) {
    let wishlist = JSON.parse(localStorage.getItem("vibeWishlist")) || [];
    let cart = JSON.parse(localStorage.getItem("vibeCart")) || [];

    const product = wishlist.find(item => item.id === id);
    if (product) {
        const existing = cart.find(item => item.id === id);
        if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
        } else {
            cart.push({...product, quantity: 1 });
        }
        localStorage.setItem("vibeCart", JSON.stringify(cart));
        removeFromWishlist(id);
        alert("Product moved to cart!");
    }
}
//my order page..................................................................
// Handle Order Success & Save to Orders
function handleOrderSubmit(event) {
    event.preventDefault();

    // Get form input values (Name, Phone, Address)
    const formElements = event.target.elements;
    const orderDetails = {
        orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        product: currentProduct,
        fullName: formElements[0].value,
        phone: formElements[1].value,
        address: formElements[2].value,
        totalPrice: currentProduct.price,
        status: "Confirmed"
    };

    let existingOrders = JSON.parse(localStorage.getItem("vibeOrders")) || [];
    existingOrders.unshift(orderDetails);
    localStorage.setItem("vibeOrders", JSON.stringify(existingOrders));

    const modalBody = document.getElementById("modal-body-content");
    modalBody.innerHTML = `
        <div class="text-center py-4">
            <div class="mb-3">
                <i class="fa fa-check-circle text-success" style="font-size: 60px;"></i>
            </div>
            <h3 class="fw-bold text-success mb-2">Order Successful!</h3>
            <p class="text-muted mb-2">Aapka order successfully place ho gaya hai.</p>
            <p class="small text-muted mb-4">Order ID: <strong>${orderDetails.orderId}</strong></p>
            <div class="alert alert-light border rounded-3 p-3 mb-4">
                <h5 class="fw-bold text-primary mb-0">Thank you for shopping with VibeCart!</h5>
            </div>
            <div class="d-flex justify-content-center gap-2">
                <button class="btn btn-outline-primary rounded-pill px-4" data-bs-dismiss="modal">Continue Shopping</button>
                <a href="./order.html" class="btn btn-primary rounded-pill px-4">View My Orders</a>
            </div>
        </div>
    `;
}
document.addEventListener("DOMContentLoaded", () => {
    renderOrders();
});

function renderOrders() {
    const ordersContainer = document.getElementById("orders-container");
    if (!ordersContainer) return;

    const orders = JSON.parse(localStorage.getItem("vibeOrders")) || [];

    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fa fa-box-open display-1 text-muted mb-3"></i>
                <h4 class="text-muted">No orders placed yet!</h4>
                <p class="text-muted small">Aapne abhi tak koi order nahi kiya hai.</p>
                <a href="./index.html" class="btn btn-primary rounded-pill px-4 mt-2">Start Shopping</a>
            </div>
        `;
        return;
    }

    ordersContainer.innerHTML = orders.map(order => `
        <div class="col-12">
            <div class="card border-0 shadow-sm rounded-4 p-4 mb-3">
                <div class="row align-items-center g-3">
                    <!-- Product Image -->
                    <div class="col-md-2 text-center">
                        <img src="${order.product.thumbnail || order.product.images[0]}" alt="${order.product.title}" class="img-fluid rounded-3" style="height: 100px; object-fit: contain;">
                    </div>
                    <!-- Product & Order Info -->
                    <div class="col-md-6">
                        <span class="badge bg-success-subtle text-success mb-1">${order.status}</span>
                        <h5 class="fw-bold text-dark mb-1">${order.product.title}</h5>
                        <p class="text-muted small mb-1">Order ID: <strong>${order.orderId}</strong> | Date: ${order.date}</p>
                        <p class="text-muted small mb-0">Delivery Address: ${order.address} (${order.phone})</p>
                    </div>
                    <!-- Price & Action -->
                    <div class="col-md-4 text-md-end">
                        <h4 class="fw-bold text-primary mb-2">$${order.totalPrice}</h4>
                        <span class="badge bg-light text-dark border px-3 py-2">Qty: ${order.product.quantity || 1}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join("");
}
//my order page end.................................................................

//login page............................................................................
let currentCaptcha = "";

// Generate random Captcha string on page load
function generateCaptcha() {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let captcha = "";
    for (let i = 0; i < 5; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    currentCaptcha = captcha;
    document.getElementById("captchaBox").innerText = currentCaptcha;
}


window.onload = function() {
    generateCaptcha();
};

function handleSignup(event) {
    event.preventDefault();

    const username = document.getElementById("usernameInput").value;
    const email = document.getElementById("emailInput").value;
    const password = document.getElementById("passwordInput").value;
    const confirmPassword = document.getElementById("confirmPasswordInput").value;
    const userCaptcha = document.getElementById("captchaInput").value;
    const captchaError = document.getElementById("captchaError");


    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    if (userCaptcha !== currentCaptcha) {
        captchaError.classList.remove("d-none");
        generateCaptcha();
        return;
    } else {
        captchaError.classList.add("d-none");
    }

    const userData = {
        username: username,
        email: email,
        joinedDate: new Date().toLocaleDateString()
    };
    localStorage.setItem("vibeCardUser", JSON.stringify(userData));

    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();
}

function redirectToAccount() {
    window.location.href = "account.html";
}