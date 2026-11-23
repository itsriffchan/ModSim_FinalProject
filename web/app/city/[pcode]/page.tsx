import { CityRedirect } from '@/components/city/CityRedirect';

export default async function CityPage({
  params,
}: {
  params: Promise<{ pcode: string }>;
}) {
  const { pcode } = await params;
  return <CityRedirect pcode={decodeURIComponent(pcode)} />;
}