import { Suspense } from "react"
import LoginPage from "./login"
export default function Home() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  )
}