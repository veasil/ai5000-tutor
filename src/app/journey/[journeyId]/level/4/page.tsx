import { PrototypeLevelShell } from "../PrototypeLevelShell";

type Level4PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level4Page({ params }: Level4PageProps) {
  const { journeyId } = await params;
  return <PrototypeLevelShell journeyId={journeyId} level={4} />;
}
