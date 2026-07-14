import { PrototypeLevelShell } from "../PrototypeLevelShell";

type Level9PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level9Page({ params }: Level9PageProps) {
  const { journeyId } = await params;
  return <PrototypeLevelShell journeyId={journeyId} level={9} />;
}
