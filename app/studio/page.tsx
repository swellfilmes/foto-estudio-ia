import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/access-token";
import StudioShell from "@/components/StudioShell";

// ?project=<id> reabre um projeto salvo (produto + referências) direto no estúdio.
// O /studio é público (porta de entrada): descobrimos AQUI, no servidor, se há
// sessão válida, pra já renderizar logado/deslogado sem piscar a tela.
export default async function StudioPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const sp = await searchParams;
  const project = typeof sp?.project === "string" ? sp.project : undefined;

  const token = (await cookies()).get("swell-subscriber")?.value;
  const email = token ? await verifySessionToken(token) : null;

  return <StudioShell initialProjectId={project} initialLoggedIn={!!email} />;
}
