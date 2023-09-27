import AuthProvider from './AuthProvider';
import ClientAuthInfo from './ClientAuthInfo'
import ServerAuthInfo from './ServerAuthInfo'

export default function Home() {
  return (
    <main>
      <AuthProvider>
        <ClientAuthInfo />
      </AuthProvider>
      <ServerAuthInfo />
    </main>
  )
}
