import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/access-token";
import StudioShell from "@/components/StudioShell";

// A PORTA DE ENTRADA do site É a própria plataforma: quem digita o endereço cai
// direto na tela de subir a foto. O login só aparece quando a pessoa clica pra
// adicionar uma imagem (aí entra com a cota grátis; acabou a cota → plano).
// Descobrimos a sessão aqui no servidor pra já renderizar logado/deslogado sem piscar.
export default async function Home() {
  const token = (await cookies()).get("swell-subscriber")?.value;
  const email = token ? await verifySessionToken(token) : null;
  return <StudioShell initialLoggedIn={!!email} />;
}
