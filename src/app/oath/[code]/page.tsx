import { redirect } from "next/navigation";

export default async function OathRedirect({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  redirect(`/?ref=${encodeURIComponent(code)}`);
}
