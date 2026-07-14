import { Level1WqtEmbed } from "./Level1WqtEmbed";

type Level1PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level1Page({ params }: Level1PageProps) {
  const { journeyId } = await params;
  const wqtUrl =
    process.env.NEXT_PUBLIC_WQT_LEVEL1_URL ||
    process.env.NEXT_PUBLIC_WQT_BASE_URL ||
    "https://www.ai5000days.com/";

  return <Level1WqtEmbed journeyId={journeyId} wqtUrl={wqtUrl} />;
}
