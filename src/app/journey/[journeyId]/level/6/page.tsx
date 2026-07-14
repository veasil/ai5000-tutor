import { PrototypeLevelShell } from "../PrototypeLevelShell";

type Level6PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level6Page({ params }: Level6PageProps) {
  const { journeyId } = await params;
  return <PrototypeLevelShell journeyId={journeyId} level={6} />;
}
