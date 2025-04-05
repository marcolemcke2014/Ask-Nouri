import '../styles/globals.css'
import { UserProfileProvider } from '../contexts/UserProfileContext'
import { OCRProvider } from '../contexts/OCRContext'
import { MenuAnalysisProvider } from '../contexts/MenuAnalysisContext'
import { NavigationProvider } from '../contexts/NavigationContext'

function MyApp({ Component, pageProps }) {
  return (
    <NavigationProvider>
      <UserProfileProvider>
        <OCRProvider>
          <MenuAnalysisProvider>
            <Component {...pageProps} />
          </MenuAnalysisProvider>
        </OCRProvider>
      </UserProfileProvider>
    </NavigationProvider>
  )
}

export default MyApp