import { PrototypeLevelShell } from "../PrototypeLevelShell";

type Level8PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level8Page({ params }: Level8PageProps) {
  const { journeyId } = await params;
  return <PrototypeLevelShell journeyId={journeyId} level={8} />;
}
