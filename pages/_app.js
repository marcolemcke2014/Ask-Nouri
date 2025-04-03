import '../styles/globals.css'
import { UserProfileProvider } from '../contexts/UserProfileContext'
import { OCRProvider } from '../contexts/OCRContext'
import { MenuAnalysisProvider } from '../contexts/MenuAnalysisContext'

function MyApp({ Component, pageProps }) {
  return (
    <UserProfileProvider>
      <OCRProvider>
        <MenuAnalysisProvider>
          <Component {...pageProps} />
        </MenuAnalysisProvider>
      </OCRProvider>
    </UserProfileProvider>
  )
}

export default MyApp