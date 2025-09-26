// src/pages/api/cart.js
export const prerender = false;

const SHOPIFY_STORE_DOMAIN = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_API_TOKEN = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN;
const storefrontApiUrl = `https://${SHOPIFY_STORE_DOMAIN}/api/2023-10/graphql.json`;

// The complete GraphQL query that fetches all the data we need.
const CART_QUERY_FRAGMENT = `
  id
  checkoutUrl
  totalQuantity
  cost {
    subtotalAmount {
      amount
    }
  }
  lines(first: 10) {
    edges {
      node {
        id
        quantity
        cost {
          totalAmount {
            amount
          }
        }
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

async function shopifyFetch({ query, variables }) {
    const res = await fetch(storefrontApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_API_TOKEN },
        body: JSON.stringify({ query, variables }),
    });
    return res.json();
}

export async function GET({ url }) {
  const cartId = new URL(url).searchParams.get('cartId');
  if (!cartId) return new Response(JSON.stringify({ error: 'cartId is required' }), { status: 400 });

  const query = `query getCart($cartId: ID!) { cart(id: $cartId) { ${CART_QUERY_FRAGMENT} } }`;
  const json = await shopifyFetch({ query, variables: { cartId } });
  return new Response(JSON.stringify(json.data));
}


export async function POST({ request }) {
    const { action, cartId, variantId, lineId, quantity } = await request.json();

    let query;
    let variables;

    switch (action) {
        case 'create':
            query = `mutation createCart($cartInput: CartInput) { cartCreate(input: $cartInput) { cart { ${CART_QUERY_FRAGMENT} } } }`;
            variables = { cartInput: { lines: [{ quantity: 1, merchandiseId: variantId }] } };
            const createData = await shopifyFetch({ query, variables });
            return new Response(JSON.stringify(createData.data.cartCreate));

        case 'add':
            query = `mutation addToCart($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_QUERY_FRAGMENT} } userErrors { message } } }`;
            variables = { cartId, lines: [{ quantity: 1, merchandiseId: variantId }] };
            break;

        case 'remove':
            query = `mutation removeLines($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${CART_QUERY_FRAGMENT} } userErrors { message } } }`;
            variables = { cartId, lineIds: [lineId] };
            break;
            
        case 'update':
            query = `mutation updateLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_QUERY_FRAGMENT} } userErrors { message } } }`;
            variables = { cartId, lines: [{ id: lineId, quantity }] };
            break;

        default:
            return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    }
    
    const shopifyData = await shopifyFetch({ query, variables });
    const dataKey = Object.keys(shopifyData.data)[0];
    const data = shopifyData.data[dataKey];

    if (data.userErrors && data.userErrors.length > 0) {
        console.error("Shopify userErrors:", data.userErrors);
        // Check for the specific error related to completed/invalid carts
        if (data.userErrors[0].message.toLowerCase().includes('cart is locked') || data.userErrors[0].message.toLowerCase().includes('invalid id')) {
            return new Response(JSON.stringify({ error: 'invalid_cart' }), { status: 400 });
        }
        return new Response(JSON.stringify({ error: 'Shopify error', details: data.userErrors }), { status: 500 });
    }
    
    return new Response(JSON.stringify(data));
}