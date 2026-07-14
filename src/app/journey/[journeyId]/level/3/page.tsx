import { PrototypeLevelShell } from "../PrototypeLevelShell";

type Level3PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level3Page({ params }: Level3PageProps) {
  const { journeyId } = await params;
  return <PrototypeLevelShell journeyId={journeyId} level={3} />;
}
