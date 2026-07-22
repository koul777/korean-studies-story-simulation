import StoryGame from "./StoryGame";

type SearchParams = Record<string, string | string[] | undefined>;

type HomeProps = {
  searchParams?: SearchParams | Promise<SearchParams>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  return <StoryGame initialScene={firstParam(resolvedSearchParams?.scene)} />;
}
