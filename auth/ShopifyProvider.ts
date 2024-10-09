import { OAuthConfig, OAuthUserConfig } from 'next-auth/providers/oauth'
import { cookies } from 'next/headers'

const CUSTOMER_SHOP_ID = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID
const CUSTOMER_API_VERSION = '2024-07'

// cookies name to store access token
const CUSTOMER_ACCOUNT_ACCESS_TOKEN_COOKIE = 'customer-access-token'

interface ShopifyCustomer {
  id: string;
  displayName: string;
  emailAddress: {
    emailAddress: string;
  }
}

const getCustomerGql = `#graphql
  query getCustomerForSession {
    customer {
      id
      displayName
      emailAddress {
          emailAddress
      }
    }
  }
`

const ShopifyProvider = (options: OAuthUserConfig<ShopifyCustomer>): OAuthConfig<ShopifyCustomer> => {
  return {
    id: 'shopify',
    name: 'Shopify',
    type: 'oauth',
    checks: ['state', 'nonce'],
    authorization: {
      url: `https://shopify.com/authentication/${CUSTOMER_SHOP_ID}/oauth/authorize`,
      params: {
        scope: 'openid email customer-account-api:full',
        client_id: options.clientId,
        response_type: 'code',
      },
    },
    token: {
      request: async ({ params, checks, provider }) => {
        if (!params.code) {
          throw new Error('code search params is missing')
        }

        if (!checks.code_verifier) {
          throw new Error('code_verifier is missing')
        }

        const credentials = btoa(`${provider.clientId}:${provider.clientSecret}`);

        const tokenResponse = await fetch(`https://shopify.com/authentication/${CUSTOMER_SHOP_ID}/oauth/token`, {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${credentials}`,
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: provider.clientId!,
            redirect_uri: provider.callbackUrl,
            code: params.code,
            code_verifier: checks.code_verifier,
          }),
        })

        if (!tokenResponse.ok) {
          throw new Error(
            `${tokenResponse.status} (RequestID ${tokenResponse.headers.get(
              'x-request-id'
            )}): ${await tokenResponse.text()}`
          )
        }

        interface AccessTokenResponse {
          access_token: string
          expires_in: number // in seconds
          id_token: string
          refresh_token: string
        }
        const data = (await tokenResponse.json()) as AccessTokenResponse

        // store access token into cookies so we can retrieve it when calling customer account api in server and client
        cookies().set(CUSTOMER_ACCOUNT_ACCESS_TOKEN_COOKIE, data.access_token, {
          expires: Date.now() + data.expires_in * 1000,
        })

        return {
          tokens: {
            access_token: data.access_token,
            id_token: data.id_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
          },
        }
      },
    },
    userinfo: {
      request: async ({ tokens }) => {
        if (!tokens.access_token) {
          throw new Error('access token is missing')
        }

        const response = await fetch(
          `https://shopify.com/${CUSTOMER_SHOP_ID}/account/customer/api/${CUSTOMER_API_VERSION}/graphql`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: tokens.access_token,
            },
            body: JSON.stringify({
              operationName: 'GetCustomerForSession',
              query: getCustomerGql,
              variables: {},
            }),
          }
        )

        if (!response.ok) {
          throw new Error(
            `${response.status} (RequestID ${response.headers.get('x-request-id')}): ${await response.text()}`
          )
        }

        interface GraphQLResponse {
          data: { customer: any } // XXX: ShopifyCustomer is not matched to Profile interface that next-auth expects
        }
        const { data } = (await response.json()) as GraphQLResponse
        return data.customer
      },
    },
    profile: async (profile) => {
      return {
        id: profile.id,
        name: profile.displayName,
        email: profile.emailAddress.emailAddress,
        image: null,
      }
    },
    options,
  }
}

export default ShopifyProvider
