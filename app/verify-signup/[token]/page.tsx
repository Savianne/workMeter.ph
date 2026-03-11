import VerifySignupPage from "./VerifySignupPage";

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>,
}) {
    const token = (await params).token;
    return (
        <>
            <VerifySignupPage token={token}/>
        </>
    )
}
