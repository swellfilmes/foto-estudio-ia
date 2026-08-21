import { redirect } from "next/navigation";

// A porta de entrada agora é o próprio estúdio (tela "Seu produto. Pronto para vender.").
// Deslogado vê a tela e o login aparece ao gerar / abrir Conta / "Criar minha marca".
export default function ComecarPage() {
  redirect("/studio?sandbox=1");
}
