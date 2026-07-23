# Plano de tarde — 2026-07-23 (revisão pós-almoço)

**Objetivo do dia:** deixar o app rodando pronto pra receber usuário + começar a materializar o produto vendável.

**Mudança de estratégia:** o pack não vai mais ser entregue via Notion. Vai ser entregue como uma **página do próprio app** (`swell.com.br/pack/chatgpt` e `/pack/nano-banana`), protegida por senha simples enviada pelo e-mail do Kiwify. Público-alvo (lojistas Shopee, brechós, artesãos) não usa Notion — atrito demais.

---

## Onde a gente está agora (snapshot)

### Código pronto e no GitHub
- App Next.js já no ar no Vercel (repo: `swellfilmes/foto-estudio-ia`)
- **Modo Produto** completo (funcionava antes)
- **Modo Pessoas / Roupa** implementado: 8 categorias × 2 estilos (apparel-engine)
- **Gate de acesso** implementado: landing em `/` captura nome + e-mail antes de liberar `/studio`
- Leads gravados em `data/leads.json` (local) + logs Vercel

### O que falta pra vender
1. **Páginas do pack no app** (`/pack/chatgpt` e `/pack/nano-banana`) — João (com Claude)
2. **Configurar Kiwify** (produtos, checkout, order bump, e-mail automático) — João
3. **Página de vendas** simples (pode ser landing só, pode ser integrada ao Kiwify) — João
4. **Testar o Modo Pessoas com peças reais** + refinar prompts se precisar — Sócia
5. **Gerar ativos antes/depois** com fotos reais dela — Sócia
6. **Rodada final juntos:** escolher ativos, montar carrossel — fim do dia

---

## Nova divisão de papéis

| Papel | Pessoa | Foco |
|---|---|---|
| **Página + Vendas** | **João** (com Claude) | Páginas do pack no app, Kiwify (produtos + checkout + e-mails), página de vendas, deploy |
| **Ensaio de pessoas / testes** | **Sócia** | Usar o Modo Pessoas do app com peças reais, gerar ativos antes/depois, validar prompts, apontar bugs |
| **Rodada final juntos** | Ambos | Escolher os pares antes/depois mais fortes, decidir data de lançamento, alinhar outreach |

**Como funciona a colaboração hoje:**
- **Duas frentes em paralelo**, sem depender uma da outra
- **Check-in a cada 1h30** (às 15h30, 17h, 18h30) — cada um mostra o que fez, alinha próximo bloco
- **Fim do dia (~19h):** rodada final juntos

---

## Frente 1 — João (página + vendas)

Trabalha comigo (Claude) no código quando precisar, e sozinho no Kiwify.

### Bloco 1.1 · Páginas do pack no app — ~1h30 (Claude implementa)
Enquanto Claude codifica, você acompanha e valida direção.

Escopo:
- [ ] Rota `/pack/chatgpt` com todo o conteúdo do pack ChatGPT
- [ ] Rota `/pack/nano-banana` com todo o conteúdo do pack Nano Banana
- [ ] Cada prompt em bloco de código com botão **"Copiar prompt"** gigante
- [ ] 6 tipos de foto em seções colapsáveis (toggles)
- [ ] Callouts coloridos (comece aqui laranja, erro comum vermelho, dica azul)
- [ ] Rodapé do Pack ChatGPT com CTA de upsell pro Pack NB
- [ ] Gate por senha: cliente entra via link `swell.com.br/pack/chatgpt?p=SENHA` (senha diferente por pack)
- [ ] Design consistente com o resto do app (cores da marca, tipografia)

**Critério de "pronto":** conseguir abrir ambas as páginas com a senha, os prompts copiam com um clique, e a UI é consistente com o estúdio.

### Bloco 1.2 · Configurar Kiwify — ~1.5h (você sozinho)
Base: `fase3-lancamento/checkout.md`

- [ ] Criar conta no Kiwify (se não tiver ainda)
- [ ] Cadastrar produto **Pack ChatGPT** — R$27 de lançamento (de R$37)
  - Entrega: link direto `swell.com.br/pack/chatgpt?p=SENHA-CHATGPT`
- [ ] Cadastrar produto **Pack Nano Banana** — R$67 de lançamento (de R$97)
  - Entrega: link direto `swell.com.br/pack/nano-banana?p=SENHA-NB`
- [ ] Ativar **order bump** no checkout do Pack ChatGPT: "Adicionar Pack NB por mais R$47"
- [ ] Ativar **OTO** (One Time Offer) pós-compra — texto no MD checkout.md
- [ ] Configurar e-mail automático pós-compra usando o template do MD (com o link + senha do pack)
- [ ] Configurar garantia 7 dias em ambos
- [ ] Testar checkout em navegador anônimo (Kiwify tem modo teste)

**Critério de "pronto":** dois links de checkout funcionando, order bump aparece, e-mail chega com o link do pack + senha e o cliente consegue abrir.

### Bloco 1.3 · Página de vendas — ~1h (você sozinho)
Duas opções:
- **A (mais simples):** usar a página de checkout do Kiwify como página de vendas (Kiwify tem editor com headline, benefícios, prova social, botão comprar)
- **B (mais controlada):** criar uma rota `/comprar` no app com página de vendas custom — mais bonito, mais alinhado à marca, mas leva mais tempo

Recomendo **A** pra hoje. **B** pode ser feito depois pra otimizar conversão.

- [ ] Escolher opção A ou B
- [ ] Se A: preencher a página do Kiwify com copy vinda do `fase3-lancamento/faq-pagina-vendas.md` + antes/depois
- [ ] Se B: pedir pro Claude criar a rota `/comprar`

**Critério de "pronto":** URL única que qualquer pessoa pode clicar e comprar.

---

## Frente 2 — Sócia (ensaio de pessoas + testes)

Trabalha sozinha usando o app. Não precisa de Claude — precisa do link do app em produção.

### Bloco 2.1 · Testar o Modo Produto — 20 min
Warm-up: garante que ela entende o fluxo antes de partir pro modo pessoas.

- [ ] Abrir o app em produção (João passa o link após o deploy da manhã)
- [ ] Preencher nome + e-mail na landing (qualquer e-mail teste)
- [ ] Testar 1 produto qualquer (perfume, garrafa, sabonete — o que tiver por perto)
- [ ] Modo Produto → gerar 4 variações
- [ ] Anotar: análise da IA acertou os campos? Imagens ficaram boas?

**Critério de "pronto":** 4 imagens geradas com sucesso, sem bugs.

### Bloco 2.2 · Rodar 3 peças de roupa reais no Modo Pessoas — ~1h30
Este é o coração do que ela vai fazer.

- [ ] Escolher 3 peças físicas (recomendado: 1 camiseta, 1 moletom/vestido, 1 peça com estampa forte)
- [ ] Fotografar cada peça sozinha:
  - Plana em cima de superfície neutra OU pendurada em cabide
  - Luz natural (perto de janela)
  - Peça inteira aparecendo
- [ ] Rodar cada peça no Modo Pessoas testando **3 categorias diferentes** cada:
  - Peça 1 (camiseta): `studio` + `model-studio` + `ghost-mannequin`
  - Peça 2 (moletom/vestido): `model-lifestyle` + `campaign-editorial` + `flat-lay`
  - Peça 3 (com estampa): `product-in-hand` + `ugc-selfie` + `model-studio`
- [ ] Salvar TODAS as imagens geradas numa pasta `assets/pessoas/` no computador
- [ ] Fazer print da tela do prompt gerado (só copiar não basta — screenshot do resultado do app)

**Critério de "pronto":** 9 sessões (3 peças × 3 categorias) × 4 imagens cada = 36 imagens geradas, salvas, com screenshots.

**O que anotar em cada teste (num Google Docs simples):**
1. Categoria testada
2. Style Strength usado (aparece na tela do prompt)
3. As 4 imagens ficaram fiéis à peça original? (nota 1-5)
4. Se não ficou fiel: o que a IA errou? (comprimento? cor? estampa?)
5. Qual foi a melhor das 4?
6. Bugs de UI/UX que apareceram no caminho (qualquer coisa estranha)

### Bloco 2.3 · Rodada de refinamento (se necessário) — ~30 min
Se algum tipo de categoria estiver saindo mal, ela avisa João. Aí ajustamos os prompts no `apparel-engine.ts`.

- [ ] Se detectou categoria fraca: comunicar João (via WhatsApp/mensagem)
- [ ] João + Claude ajustam
- [ ] Ela regera pra validar
- [ ] Repetir se necessário

**Critério de "pronto":** todas as categorias que ela testou estão gerando resultados aceitáveis (nota ≥ 3/5).

---

## Frente 3 — Juntos (fim da tarde)

### Bloco 3 · Rodada final — ~1h
Depende dos blocos 1.1, 1.2 e 2.2 estarem prontos.

- [ ] Sócia mostra as melhores imagens do bloco 2.2
- [ ] João mostra Kiwify + página do pack prontos
- [ ] Escolher 3–5 pares mais fortes (foto original × imagem gerada) — cobrindo categorias diferentes
- [ ] Colocar esses pares na **galeria da página do pack** (Claude adiciona rapidinho)
- [ ] Colocar os mesmos pares no **carrossel do Instagram** (usar Canva com template do `fase3-lancamento/carrossel-instagram.md`)
- [ ] Definir data de postagem do Carrossel 1

**Critério de "pronto":** galeria da página do pack tem imagens reais, e o Carrossel 1 do Instagram tá quase pronto (só falta agendar).

### Bloco 4 · Alinhamento final — 15 min
- [ ] Data de lançamento definida (recomendado: 3 a 5 dias depois de hoje)
- [ ] Divisão de outreach: quem faz cada perfil de `fase3-lancamento/outreach.md`
- [ ] Meta da semana 1: 20 contatos individuais + 3 posts orgânicos
- [ ] Tirar screenshots de tudo (Kiwify, página do pack, checkout) — arquivo dos "materiais entregues hoje"

**Critério de "pronto":** data marcada + próxima semana planejada.

---

## Cronograma sugerido (~5h de trabalho ativo)

| Horário | João | Sócia |
|---|---|---|
| 14:00 – 15:30 | Bloco 1.1 · Páginas do pack (com Claude) | Bloco 2.1 · Testar Modo Produto |
| **15:30 – 15:45** | **Check-in 1** — mostra páginas prontas | ela mostra testes iniciais |
| 15:45 – 17:00 | Bloco 1.2 · Kiwify | Bloco 2.2 · Testar 3 peças (começa) |
| **17:00 – 17:15** | **Check-in 2** — Kiwify configurado | ela mostra 1ª peça pronta |
| 17:15 – 18:15 | Bloco 1.3 · Página de vendas | Bloco 2.2 · Testar 3 peças (termina) |
| **18:15 – 18:30** | **Check-in 3** — página de vendas | ela mostra 3 peças completas |
| 18:30 – 19:00 | Aguardar / ajustes finais | Bloco 2.3 · Refinamento (se preciso) |
| **19:00 – 20:00** | **Bloco 3 juntos** — rodada final | |
| **20:00 – 20:15** | **Bloco 4 juntos** — alinhamento | |

---

## Checklist final do dia (o que precisa estar de pé às 20:15)

- [ ] App em produção com gate + estúdio + páginas do pack funcionando
- [ ] Ambos os packs (ChatGPT e NB) acessíveis via link + senha
- [ ] 2 produtos cadastrados no Kiwify com checkout funcional
- [ ] Order bump + OTO + e-mail pós-compra ativados
- [ ] Página de vendas no ar (Kiwify ou custom)
- [ ] Sócia testou 3 peças em 3 categorias cada (36 imagens geradas)
- [ ] Bugs críticos do Modo Pessoas identificados e corrigidos (se houver)
- [ ] 3–5 pares antes/depois escolhidos e na galeria
- [ ] Carrossel do Instagram com pares reais
- [ ] Data de lançamento definida
- [ ] Plano da primeira semana de outreach definido

---

## Riscos e o que fazer se der ruim

**"Kiwify pediu documentação e não liberou hoje"** → cadastro é imediato mas às vezes exigem CPF/CNPJ. Se travar, ir pro **Hotmart** como plano B.

**"Modo Pessoas gera peça errada em alguma categoria"** → é esperado. Anotar quais categorias, avisar João. Ajustamos prompts do apparel-engine e ela testa de novo.

**"Sócia acabou os créditos Magnific"** → recarregar em https://magnific.com/billing. Enquanto isso, o app não trava — só o "Gerar fotos" não funciona.

**"Faltou tempo pra tudo"** → **prioridade absoluta:** ter as páginas do pack + Kiwify funcionando com pelo menos 1 par antes/depois. Página de vendas custom pode ser feita amanhã. Carrossel do Instagram pode ser feito amanhã.

---

## Contato + notas soltas

- **Repo do app:** `swellfilmes/foto-estudio-ia` (GitHub)
- **Deploy:** Vercel (projeto id `prj_zTSsSudxGDlVXP9ru0bGwDqy0cDB`)
- **APIs em uso:** Anthropic (análise de imagem) + Magnific (geração Nano Banana)
- **Custo de teste da sócia:** 9 sessões × 4 imagens = ~36 créditos Magnific (~1 sessão típica de trabalho)
- **E-mail dos leads:** grava em `data/leads.json` (local) + logs Vercel. Dashboard futuro via Google Sheets (webhook, 20 min de dev)
- **Senhas dos packs:** decidir hoje. Sugestão: `swellchatgpt2026` e `swellnb2026` — fáceis de digitar, difíceis de adivinhar

---

_Documento atualizado 2026-07-23 pós-almoço. Última mudança: papéis invertidos — João = página+vendas, Sócia = ensaio de pessoas._
