import { getServerSession, AuthOptions } from 'next-auth'
import ShopifyProvider from './ShopifyProvider'

const CUSTOMER_SHOP_ID = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID

export const authOptions: AuthOptions = {
  providers: [
    ShopifyProvider({
      clientId: process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID,
      clientSecret: process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    jwt({ token, account }) {
      if (account) {
        token.id_token = account.id_token
        token.expires_at = account.expires_at
      }

      // XXX: force token invalidation if expired
      const expiresAt = (token.expires_at as number | undefined) ?? 0
      if (Date.now() > expiresAt * 1000) {
        throw new Error('Session expired')
      }

      return token
    },
  },
  events: {
    async signOut({ token }) {
      // trigger sign out on Shopify
      const signOutUrl = new URL(`https://shopify.com/${CUSTOMER_SHOP_ID}/auth/logout`)
      if (token.id_token) {
        signOutUrl.searchParams.append('id_token_hint', token.id_token as string)
      }

      await fetch(signOutUrl)
    },
  },
}

/**
 * Get auth session for server components and API routes
 */
export const getAuthSession = () => {
  return getServerSession(authOptions)
}
