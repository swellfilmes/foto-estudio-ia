import StudioShell from "@/components/StudioShell";

// ?project=<id> reabre um projeto salvo (produto + referências) direto no estúdio.
export default async function StudioPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const sp = await searchParams;
  const project = typeof sp?.project === "string" ? sp.project : undefined;
  return <StudioShell initialProjectId={project} />;
}
