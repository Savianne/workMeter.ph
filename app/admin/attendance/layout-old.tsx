
import StyledLayout from "./StyledLayout"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <StyledLayout>
        {children}
    </StyledLayout>
  )
}