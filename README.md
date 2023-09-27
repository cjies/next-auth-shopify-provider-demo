# next-auth custom oauth provider with Shopify Customer Account API

Demo of creating a next-auth oath provider with [Shopify Customer Account API](https://shopify.dev/docs/api/customer)

## Shopify Setup

1. Install [headless](https://apps.shopify.com/headless) app on Shopify
2. Choose "Confidential" client type
3. Configure callback URL, use `http://localhost:3000/api/auth/callback/shopify` for local testing
4. Copy Client ID, Client secret and shop ID (from Application endpoints) to your `.env` file
