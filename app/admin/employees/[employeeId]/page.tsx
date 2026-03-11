import Profile from "./Profile";

export default async function Page({
  params,
}: {
  params: Promise<{ employeeId: string }>,
}) {
  const employeeId = (await params).employeeId;

  return (
    <Profile profileId={employeeId}/>
  )
}
