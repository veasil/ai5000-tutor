import { PrototypeLevelShell } from "../PrototypeLevelShell";

type Level10PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level10Page({ params }: Level10PageProps) {
  const { journeyId } = await params;
  return <PrototypeLevelShell journeyId={journeyId} level={10} />;
}
