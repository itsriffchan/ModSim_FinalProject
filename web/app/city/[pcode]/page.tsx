import { CityView } from '@/components/city/CityView';

export default async function CityPage({
  params,
}: {
  params: Promise<{ pcode: string }>;
}) {
  const { pcode } = await params;
  return <CityView pcode={decodeURIComponent(pcode)} />;
}