import { Studio } from "@/components/Studio";

type HomeProps = {
  searchParams?: Promise<{
    remix?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = searchParams ? await searchParams : undefined;

  return <Studio initialRemixId={params?.remix ?? null} />;
}
