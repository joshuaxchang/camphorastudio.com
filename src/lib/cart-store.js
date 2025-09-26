// src/lib/cart-store.js

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
const cartOpenButtons = document.querySelectorAll('.open-cart');

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

function triggerCartIconAnimation() {
    cartOpenButtons.forEach(btn => {
        btn.classList.add('animate-shake');
        setTimeout(() => {
            btn.classList.remove('animate-shake');
        }, 600); // Must match the animation duration
    });
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
        itemElement.className = 'flex items-center py-3 border-b gap-4'; // Added gap-4 for spacing
        itemElement.innerHTML = `
            <img src="${line.merchandise.image.url}" alt="${line.merchandise.product.title}" class="w-16 h-16 object-cover rounded-md">
            <div class="flex-grow pr-4">
                <p class="font-semibold text-lg">${line.merchandise.product.title}</p>
                <div class="flex items-center gap-3 mt-2">
                    <button data-line-id="${line.id}" data-action="decrease" class="quantity-btn h-6 w-6 flex items-center justify-center rounded-full border">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" />
                        </svg>
                    </button>
                    <input type="number" min="1" value="${line.quantity}" data-line-id="${line.id}" class="quantity-input w-12 text-center border rounded-md">
                    <button data-line-id="${line.id}" data-action="increase" class="quantity-btn h-6 w-6 flex items-center justify-center rounded-full border">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                    <button data-line-id="${line.id}" data-action="remove" class="remove-btn text-red-500 hover:text-red-700 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
            <p class="font-semibold w-20 text-right text-lg">$${parseInt(line.cost.totalAmount.amount)}</p>
        `;
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

export async function addToCart(variantId) {
    // The animation is now triggered from the page script after this completes.
    await cartAction({ action: cartId ? 'add' : 'create', variantId });
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