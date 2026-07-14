import { PrototypeLevelShell } from "../PrototypeLevelShell";

type Level5PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level5Page({ params }: Level5PageProps) {
  const { journeyId } = await params;
  return <PrototypeLevelShell journeyId={journeyId} level={5} />;
}
