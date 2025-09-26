// src/pages/api/buy-now.js
const SHOPIFY_STORE_DOMAIN = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_API_TOKEN = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN;
const storefrontApiUrl = `https://${SHOPIFY_STORE_DOMAIN}/api/2023-10/graphql.json`;

// This is the Shopify Storefront API mutation for creating a cart
const createCartMutation = `
  mutation createCart($cartInput: CartInput) {
    cartCreate(input: $cartInput) {
      cart {
        id
        checkoutUrl
      }
    }
  }
`;

export async function POST({ request }) {
  const { variantId } = await request.json();

  if (!variantId) {
    return new Response(JSON.stringify({ error: 'Missing variantId' }), { status: 400 });
  }

  try {
    const response = await fetch(storefrontApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_API_TOKEN,
      },
      body: JSON.stringify({
        query: createCartMutation,
        variables: {
          cartInput: {
            lines: [{
              quantity: 1,
              merchandiseId: variantId
            }]
          }
        }
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify API Error: ${errorText}`);
    }

    const { data, errors } = await response.json();
    
    if (errors) {
        console.error('Shopify GraphQL Errors:', errors);
        throw new Error('Failed to create cart.');
    }

    const checkoutUrl = data?.cartCreate?.cart?.checkoutUrl;

    if (!checkoutUrl) {
      throw new Error('Checkout URL not found in Shopify response.');
    }

    return new Response(JSON.stringify({ checkoutUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in /api/buy-now:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}