// src/lib/cart-store.js

// --- DOM ELEMENTS ---
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const closeCartButton = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const checkoutLink = document.getElementById('checkout-link');
const cartCountElements = document.querySelectorAll('.cart-count');

// --- STATE ---
let cartId = localStorage.getItem('cartId');
let cartData = null;

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

function updateCartUI() {
    if (!cartData) {
        cartItemsContainer.innerHTML = '<p class="text-gray-500">Your cart is empty.</p>';
        cartCountElements.forEach(el => { el.textContent = `Cart (0)`; });
        checkoutLink.href = '#';
        return;
    }

    cartItemsContainer.innerHTML = '';
    if (cartData.lines && cartData.lines.edges.length > 0) {
        cartData.lines.edges.forEach(item => {
            const line = item.node;
            const itemElement = document.createElement('div');
            itemElement.className = 'flex justify-between items-center py-2 border-b';
            itemElement.innerHTML = `
                <div>
                    <p class="font-semibold">${line.merchandise.product.title}</p>
                    <p class="text-sm text-gray-600">Quantity: ${line.quantity}</p>
                </div>
                <p class="font-semibold">$${parseInt(line.merchandise.price.amount)}</p>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
    } else {
        cartItemsContainer.innerHTML = '<p class="text-gray-500">Your cart is empty.</p>';
    }

    checkoutLink.href = cartData.checkoutUrl;

    const totalItems = cartData.totalQuantity || 0;
    cartCountElements.forEach(el => {
        el.textContent = `Cart (${totalItems})`;
    });
}


// --- API FUNCTIONS ---
export async function addToCart(variantId) {
    const isExistingCart = !!cartId;
    const action = isExistingCart ? 'add' : 'create';
    const body = isExistingCart ? { action, cartId, variantId } : { action, variantId };
    
    const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    
    if (!res.ok) {
        const errorData = await res.json();
        if (isExistingCart && errorData.error === 'invalid_cart') {
            console.warn("Invalid cart detected. Clearing and creating a new one.");
            localStorage.removeItem('cartId');
            cartId = null;
            return addToCart(variantId);
        } else {
            console.error("An unexpected error occurred:", errorData);
            return;
        }
    }

    const { cart } = await res.json();
    cartData = cart;

    if (!cartId) {
        cartId = cart.id;
        localStorage.setItem('cartId', cartId);
    }
    
    updateCartUI();
    openCart();
}

async function initializeCart() {
    if (cartId) {
        const res = await fetch(`/api/cart?cartId=${cartId}`, { cache: 'no-store' });
        if (res.ok) {
            const { cart } = await res.json();
            if (cart) {
                cartData = cart;
            } else {
                localStorage.removeItem('cartId');
                cartId = null;
                cartData = null;
            }
        }
    } else {
        cartData = null;
    }
    updateCartUI();
}

// --- INITIALIZE & ATTACH LISTENERS ---
document.querySelectorAll('.open-cart').forEach(btn => btn.addEventListener('click', openCart));
closeCartButton.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

initializeCart();

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        initializeCart();
    }
});