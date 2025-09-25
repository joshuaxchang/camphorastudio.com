// src/lib/cart-store.js

// --- DOM ELEMENTS ---
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const closeCartButton = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const checkoutLink = document.getElementById('checkout-link');
const cartCountElements = document.querySelectorAll('.cart-count'); // We'll target this class

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
    if (!cartData) return;

    // Update cart items display
    cartItemsContainer.innerHTML = ''; // Clear old items
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

    // Update checkout URL
    checkoutLink.href = cartData.checkoutUrl;

    // Update cart count in header
    const totalItems = cartData.totalQuantity || 0;
    cartCountElements.forEach(el => {
        el.textContent = `Cart (${totalItems})`;
    });
}


// --- API FUNCTIONS ---
export async function addToCart(variantId) {
    const action = cartId ? 'add' : 'create';
    const body = cartId ? { action, cartId, variantId } : { action, variantId };
    
    const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

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
        const res = await fetch(`/api/cart?cartId=${cartId}`);
        if (res.ok) {
            const { cart } = await res.json();
            if (cart) {
                cartData = cart;
                updateCartUI();
            } else {
                localStorage.removeItem('cartId');
                cartId = null;
            }
        }
    }
}

// --- INITIALIZE & ATTACH LISTENERS ---
document.querySelectorAll('.open-cart').forEach(btn => btn.addEventListener('click', openCart));
closeCartButton.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

initializeCart();