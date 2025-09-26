// src/lib/cart-store.js
console.log("Cart script is running!");
// --- DOM ELEMENTS ---
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const closeCartButton = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const checkoutLink = document.getElementById('checkout-link');
const cartCountBadge = document.getElementById('cart-count-badge');
const cartFooter = document.getElementById('cart-footer');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartLoadingBanner = document.getElementById('cart-loading-banner');

// --- STATE ---
let cartId = localStorage.getItem('cartId');
let cartData = null;
let isLoading = false; // Prevents multiple simultaneous updates
let debounceTimeout; // For the quantity input debouncer

// --- UI FUNCTIONS ---
function openCart() {
    cartDrawer.classList.remove('translate-x-full');
    cartOverlay.classList.remove('opacity-0', 'pointer-events-none');
    cartOverlay.classList.add('opacity-50');
}

function closeCart() {
    cartDrawer.classList.add('translate-x-full');
    cartOverlay.classList.add('opacity-0', 'pointer-events-none');
    cartOverlay.classList.remove('opacity-50');
}

function showLoadingState() {
    isLoading = true;
    cartDrawer.classList.add('is-loading');
    cartLoadingBanner.classList.remove('hidden');
}

function updateCartUI() {
    isLoading = false;
    cartDrawer.classList.remove('is-loading');
    cartLoadingBanner.classList.add('hidden');

    if (!cartData || !cartData.lines || cartData.lines.edges.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-gray-500">Your cart is empty.</p>';
        cartFooter.classList.add('hidden');
        cartCountBadge.classList.add('hidden');
        cartCountBadge.textContent = '0';
        return;
    }

    cartFooter.classList.remove('hidden');
    cartItemsContainer.innerHTML = '';

    cartData.lines.edges.forEach(item => {
        const line = item.node;
        const itemElement = document.createElement('div');
        // --- CHANGE STARTS HERE ---
        itemElement.className = 'flex items-center py-3 border-b gap-4'; // Added gap-4 for spacing
        itemElement.innerHTML = `
            <img src="${line.merchandise.image.url}" alt="${line.merchandise.product.title}" class="w-16 h-16 object-cover rounded-md">
            <div class="flex-grow pr-4">
                <p class="font-semibold">${line.merchandise.product.title}</p>
                <div class="flex items-center gap-3 mt-2">
                    <button data-line-id="${line.id}" data-action="decrease" class="quantity-btn text-lg font-bold h-6 w-6 flex items-center justify-center rounded-full border">-</button>
                    <input type="number" min="1" value="${line.quantity}" data-line-id="${line.id}" class="quantity-input w-12 text-center border rounded-md">
                    <button data-line-id="${line.id}" data-action="increase" class="quantity-btn text-lg font-bold h-6 w-6 flex items-center justify-center rounded-full border">+</button>
                    <button data-line-id="${line.id}" data-action="remove" class="remove-btn text-sm text-red-500 hover:underline ml-auto">Remove</button>
                </div>
            </div>
            <p class="font-semibold w-20 text-right">$${parseInt(line.cost.totalAmount.amount)}</p>
        `;
        // --- CHANGE ENDS HERE ---
        cartItemsContainer.appendChild(itemElement);
    });

    checkoutLink.href = cartData.checkoutUrl;
    cartSubtotal.textContent = `$${parseInt(cartData.cost.subtotalAmount.amount)}`;
    
    const totalItems = cartData.totalQuantity || 0;
    cartCountBadge.textContent = totalItems;
    cartCountBadge.classList.toggle('hidden', totalItems === 0);
}

// --- API & LOGIC ---

// This is now the single, central function for all cart mutations.
async function cartAction(payload) {
    if (isLoading) return;
    showLoadingState();

    let body = { ...payload };
    if (body.action === 'create') {
        body.cartId = null;
    } else {
        body.cartId = cartId;
    }

    const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorData = await res.json();
        if (cartId && errorData.error === 'invalid_cart') {
            console.warn("Invalid cart detected. Clearing and creating a new one.");
            localStorage.removeItem('cartId');
            cartId = null;
            return cartAction({ action: 'create', variantId: payload.variantId });
        }
        updateCartUI(); // Revert to last good state on other errors
        return;
    }

    const { cart } = await res.json();
    cartData = cart;

    if (!cartId && cart) {
        cartId = cart.id;
        localStorage.setItem('cartId', cartId);
    }
    
    updateCartUI();
}

export function addToCart(variantId) {
    openCart();
    cartAction({ action: cartId ? 'add' : 'create', variantId });
}

// --- INITIALIZE & ATTACH LISTENERS ---

// Event delegation for all user interactions within the cart.
cartItemsContainer.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;

    const lineId = target.dataset.lineId;
    const action = target.dataset.action;

    if (action === 'remove') {
        cartAction({ action: 'remove', lineId });
    }

    if (action === 'increase' || action === 'decrease') {
        const input = target.parentElement.querySelector('.quantity-input');
        let currentQuantity = parseInt(input.value);
        if (isNaN(currentQuantity)) {
            // Find the original item in our cart data
            const cartLine = cartData.lines.edges.find(item => item.node.id === lineId);
            // If found, revert to its quantity. Otherwise, default to 0.
            currentQuantity = cartLine ? cartLine.node.quantity : 0;
        }
        const newQuantity = action === 'increase' ? currentQuantity + 1 : currentQuantity - 1;
        
        if (newQuantity > 0) {
            cartAction({ action: 'update', lineId, quantity: newQuantity });
        } else {
            cartAction({ action: 'remove', lineId });
        }
    }
});

cartItemsContainer.addEventListener('input', (event) => {
    const target = event.target;
    if (target.classList.contains('quantity-input')) {
        clearTimeout(debounceTimeout);
        const lineId = target.dataset.lineId;
        const quantity = parseInt(target.value);

        if (!isNaN(quantity) && quantity > 0) {
            debounceTimeout = setTimeout(() => {
                cartAction({ action: 'update', lineId, quantity });
            }, 500); // 500ms delay
        } else if (target.value === '0') {
            cartAction({ action: 'remove', lineId });
        }
    }
});

async function initializeCart() {
    if (cartId) {
        const res = await fetch(`/api/cart?cartId=${cartId}`, { cache: 'no-store' });
        if (res.ok) {
            const { cart } = await res.json();
            cartData = cart || null;
            if (!cart) {
                localStorage.removeItem('cartId');
                cartId = null;
            }
        }
    } else {
        cartData = null;
    }
    updateCartUI();
}

document.querySelectorAll('.open-cart').forEach(btn => btn.addEventListener('click', openCart));
closeCartButton.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

initializeCart();

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        initializeCart();
    }
});