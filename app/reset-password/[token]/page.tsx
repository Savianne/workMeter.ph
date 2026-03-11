import ResetPasswordPageContent from "./ResetPasswordPageContent";

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>,
}) {
    const token = (await params).token;
    return (
        <>
            <ResetPasswordPageContent token={token}/>
        </>
    )
}
