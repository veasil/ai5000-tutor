import { PrototypeLevelShell } from "../PrototypeLevelShell";

type Level2PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level2Page({ params }: Level2PageProps) {
  const { journeyId } = await params;
  return <PrototypeLevelShell journeyId={journeyId} level={2} />;
}
