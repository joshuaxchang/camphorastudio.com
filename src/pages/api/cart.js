// src/pages/api/cart.js
export const prerender = false;

const SHOPIFY_STORE_DOMAIN = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_API_TOKEN = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN;
const storefrontApiUrl = `https://${SHOPIFY_STORE_DOMAIN}/api/2023-10/graphql.json`;

const CART_QUERY_FRAGMENT = `
  id
  checkoutUrl
  totalQuantity
  lines(first: 10) {
    edges {
      node {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            price { amount }
            product { title }
          }
        }
      }
    }
  }
`;

// --- THIS IS THE RESTORED GET FUNCTION ---
export async function GET({ url }) {
  const cartId = new URL(url).searchParams.get('cartId');
  if (!cartId) return new Response(JSON.stringify({ error: 'cartId is required' }), { status: 400 });

  const query = `query getCart($cartId: ID!) { cart(id: $cartId) { ${CART_QUERY_FRAGMENT} } }`;
  
  const response = await fetch(storefrontApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_API_TOKEN },
    body: JSON.stringify({ query, variables: { cartId } }),
  });

  const json = await response.json();
  return new Response(JSON.stringify(json.data));
}


// POST function with improved error handling
export async function POST({ request }) {
    const { action, cartId, variantId } = await request.json();

    if (action === 'create') {
        const query = `mutation createCart($cartInput: CartInput) { cartCreate(input: $cartInput) { cart { ${CART_QUERY_FRAGMENT} } } }`;
        const variables = { cartInput: { lines: [{ quantity: 1, merchandiseId: variantId }] } };
        const response = await fetch(storefrontApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_API_TOKEN },
            body: JSON.stringify({ query, variables }),
        });
        const json = await response.json();
        return new Response(JSON.stringify(json.data.cartCreate));

    } else if (action === 'add') {
        const query = `mutation addToCart($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_QUERY_FRAGMENT} } userErrors { message } } }`;
        const variables = { cartId, lines: [{ quantity: 1, merchandiseId: variantId }] };
        const response = await fetch(storefrontApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_API_TOKEN },
            body: JSON.stringify({ query, variables }),
        });
        const json = await response.json();
        
        if (json.data.cartLinesAdd.userErrors && json.data.cartLinesAdd.userErrors.length > 0) {
            console.error("Shopify userErrors:", json.data.cartLinesAdd.userErrors);
            return new Response(JSON.stringify({ error: 'invalid_cart' }), { status: 400 });
        }
        
        return new Response(JSON.stringify(json.data.cartLinesAdd));
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
}