import { PrototypeLevelShell } from "../PrototypeLevelShell";

type Level7PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level7Page({ params }: Level7PageProps) {
  const { journeyId } = await params;
  return <PrototypeLevelShell journeyId={journeyId} level={7} />;
}
