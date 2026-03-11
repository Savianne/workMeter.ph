
import ToolpadAppProvider from "./NoSSRToolPadAppProvider"
import PageContent from "./PageContent";

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToolpadAppProvider>
      <PageContent>
        {
          children
        }
      </PageContent>
    </ToolpadAppProvider>
  )
}