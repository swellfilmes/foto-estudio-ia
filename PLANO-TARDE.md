# Plano de tarde — 2026-07-23 (revisão 3 — modelo mudou)

**Objetivo do dia:** deixar o app rodando pronto pra receber usuário + começar a comercializar.

**Modelo de negócio ATUAL:** o app **não vende prompts**, vende **resultado (fotos geradas)**.

**Duas ofertas do app:**
1. **Ensaio de Pessoa** — usuário sobe 1–3 fotos de referência, escolhe estilo (catálogo Swell), ajusta livre e recebe 8 fotos de ensaio nível Swell
2. **Foto de Produto** — usuário sobe foto do produto, IA preenche os campos sozinha, gera 4 variações

**Backend em ambos:** Magnific integrado (nossa infra, nosso crédito).

**Modelo de cobrança:** assinatura mensal via Kiwify (senha única enviada por e-mail, cookie de 30 dias no app).

---

## Onde a gente está agora (snapshot)

### Código pronto e no GitHub
- App Next.js já no ar no Vercel (repo: `swellfilmes/foto-estudio-ia`)
- **Landing (`/`)** com 2 abas: "Testar grátis" (captura de lead) e "Já sou assinante" (senha)
- **Modo Foto de Produto** completo — funcionava antes
- **Modo Ensaio de Pessoa** implementado hoje (novo) — 8 estilos curados + campo livre + geração de 8 fotos em paralelo via Magnific
- **Gate duplo** no `/studio`: aceita cookie de lead (trial) OU cookie de assinante
- APIs: `/api/analyze-person` (traços gerais) + `/api/generate-ensaio-prompt` (motor do prompt) + `/api/generate-images` atualizado (suporta múltiplas referências e aspect ratio dinâmico)

### O que falta pra vender
1. **Você definir o preço da assinatura** (sugestão: R$47/mês)
2. **Configurar Kiwify** — produto de assinatura recorrente + e-mail automático com a senha
3. **Setar variável de ambiente `SUBSCRIBER_PASSWORD` na Vercel** (senha da assinatura)
4. **Sócia testar Modo Ensaio com peças reais** — sessões de teste com fotos dela e conhecidos, gerar ativos
5. **Rodada final juntos:** escolher os 8–12 pares mais fortes, montar carrossel de venda

---

## Nova divisão de papéis

| Papel | Pessoa | Foco |
|---|---|---|
| **Página + Vendas** | **João** (com Claude quando precisar) | Kiwify (assinatura + e-mail automático), definir preço, senha em produção |
| **Testes / geração de ativos** | **Sócia** | Testar Modo Ensaio (com fotos dela ou de amigos), Modo Produto, apontar bugs |
| **Rodada final juntos** | Ambos | Escolher ativos, montar carrossel, definir data de lançamento |

---

## Frente 1 — João (Kiwify + configuração)

### Bloco 1.1 · Definir preço da assinatura — 5 min
Sugestão pra começar:
- **R$47/mês** — plano único, uso "sem limite" (na prática, limitado pelo custo Magnific)
- Alternativa: R$27 primeiro mês / R$47 recorrente (isca)

### Bloco 1.2 · Configurar Kiwify — ~1.5h
- [ ] Criar conta no Kiwify (se não tiver)
- [ ] Cadastrar produto **Swell Assinatura Mensal** — R$47/mês recorrente
- [ ] **Entrega:** link direto `https://swell.com.br?p=SENHA-DEFINIDA` (o `?p=` faz auto-login no site)
- [ ] Configurar e-mail automático pós-compra com o link + senha
- [ ] Configurar e-mail de cancelamento (informar que perderá acesso)
- [ ] Configurar garantia 7 dias
- [ ] Testar checkout em navegador anônimo

**Critério de "pronto":** consegue comprar (modo teste), recebe e-mail com link, clica no link e cai autenticado no `/studio`.

### Bloco 1.3 · Setar `SUBSCRIBER_PASSWORD` na Vercel — 5 min
- [ ] Vercel → projeto `app` → Settings → Environment Variables
- [ ] Adicionar `SUBSCRIBER_PASSWORD` = `sua-senha-forte-2026` (mesma senha que vai no e-mail Kiwify)
- [ ] Redeploy (Vercel refaz em ~1min)

**Critério de "pronto":** o gate em `/` "Já sou assinante" aceita essa senha.

### Bloco 1.4 · Página de vendas — ~1h
Duas opções:
- **A (mais simples):** usar a página de checkout do Kiwify como página de vendas (Kiwify tem editor com headline, benefícios, botão comprar)
- **B (mais controlada):** criar rota `/comprar` no app — recomendo pra depois, não hoje

Escolher A pra hoje.

- [ ] Preencher a página do Kiwify com headline + benefícios + antes/depois (usar ativos do Bloco 2.2)

---

## Frente 2 — Sócia (testes + geração de ativos)

Trabalha sozinha usando o app. Não precisa de Claude — precisa do link do app em produção + a senha de assinante.

### Bloco 2.1 · Testar Modo Ensaio — ~2h
Coração do dia. Ela precisa de:
- 2–3 pessoas (ela mesma + conhecidos que topem)
- 1–3 fotos de referência de cada pessoa (rosto bem visível, boa luz)

Passos por pessoa:
- [ ] Enviar fotos de referência (1 pessoa)
- [ ] Rodar **4 dos 8 estilos** (não precisa rodar todos)
- [ ] Testar campo livre em pelo menos 2 (ajustar detalhes específicos)
- [ ] Salvar as fotos geradas em pasta `assets/ensaio/`
- [ ] Anotar por estilo:
  - Qualidade (nota 1–5)
  - A identidade da pessoa foi preservada?
  - Cena/mood ficaram no estilo Swell?
  - Bugs de UI/UX

**Critério de "pronto":** 3 pessoas × 4 estilos × 8 fotos = **96 fotos geradas** (ou perto), com anotações.

### Bloco 2.2 · Testar Modo Produto (1 hora)
Testa se a versão antiga ainda funciona bem depois das mudanças:
- [ ] Rodar 3 produtos rapidamente
- [ ] Salvar 12 fotos (3 × 4 variações)

### Bloco 2.3 · Refinamento (se necessário)
Se algum estilo estiver saindo mal, avisa João. Ajustamos os prompts no `lib/ensaio-styles.ts`.

---

## Frente 3 — Juntos (fim da tarde)

### Bloco 3 · Rodada final — ~1h
- [ ] Sócia mostra melhores ensaios
- [ ] Escolher 3–4 casos "wow" (referência × ensaio) pra virar prova social
- [ ] Colocar na página do Kiwify (imagens + legenda)
- [ ] Montar Carrossel 1 no Canva (template no `fase3-lancamento/carrossel-instagram.md`)
- [ ] Definir data de postagem

### Bloco 4 · Alinhamento final — 15 min
- [ ] Data de lançamento
- [ ] Divisão de outreach

---

## Cronograma sugerido

| Horário | João | Sócia |
|---|---|---|
| 14:00 – 14:15 | Definir preço + setar senha na Vercel | (esperar link) |
| 14:15 – 15:30 | Bloco 1.2 · Kiwify (começa) | Bloco 2.1 · Testar Modo Ensaio (começa) |
| **15:30 – 15:45** | **Check-in 1** — status Kiwify e testes | |
| 15:45 – 17:00 | Bloco 1.2 · Kiwify (termina) | Bloco 2.1 · continua |
| 17:00 – 18:00 | Bloco 1.4 · Página de vendas | Bloco 2.2 · Modo Produto |
| **18:00 – 18:15** | **Check-in 2** — página + ensaios | |
| 18:15 – 19:00 | Refinamento de prompts (se preciso) | Bloco 2.3 · Refinamento |
| **19:00 – 20:00** | **Bloco 3 juntos** — rodada final | |
| **20:00 – 20:15** | **Bloco 4 juntos** — alinhamento | |

---

## Checklist final do dia

- [ ] App em produção com landing nova + 2 modos (Produto e Ensaio) funcionando
- [ ] `SUBSCRIBER_PASSWORD` setada na Vercel
- [ ] Produto Kiwify (assinatura mensal) cadastrado e testado
- [ ] E-mail automático da Kiwify manda link + senha corretos
- [ ] Sócia testou ~3 pessoas em ~4 estilos cada (96+ fotos)
- [ ] 3–4 casos "wow" escolhidos e na página do Kiwify
- [ ] Carrossel do Instagram com estrutura pronta
- [ ] Data de lançamento definida

---

## Riscos e o que fazer se der ruim

**"Kiwify pediu documentação e não liberou hoje"** → cadastro é imediato mas às vezes exigem CPF/CNPJ. Se travar, ir pro **Hotmart** como plano B.

**"Ensaio saiu com rosto diferente"** → é a limitação do modelo. Fotos de referência ruins (rosto escuro, óculos escuros, chapéu) pioram muito. Refazer com fotos melhores. Se persistir em várias, avisa João pra ajustar a trava de identidade.

**"Sócia acabou os créditos Magnific"** → recarregar em https://magnific.com/billing. Um ensaio consome ~8 créditos. 96 fotos = ~96 créditos.

**"Assinante pediu reembolso"** → garantia 7 dias no Kiwify cobre. Depois disso, política caso a caso.

**"Faltou tempo pra tudo"** → **prioridade absoluta:** Kiwify funcionando + 1 ensaio "wow" pra colocar na página. Outreach pode começar amanhã.

---

## Contato + notas soltas

- **Repo do app:** `swellfilmes/foto-estudio-ia` (GitHub)
- **Deploy:** Vercel (projeto id `prj_zTSsSudxGDlVXP9ru0bGwDqy0cDB`)
- **APIs em uso:** Anthropic (análise) + Magnific (geração Nano Banana)
- **Custo do teste da sócia:** ~96 imagens = ~96 créditos Magnific (~1 sessão)
- **E-mail dos leads (trial):** grava em `data/leads.json` (local) + logs Vercel
- **Senha do assinante:** env var `SUBSCRIBER_PASSWORD` na Vercel (dev usa fallback `swell-assinantes-2026`)
- **Rotação de senha:** trocar a env var uma vez por mês/trimestre invalida os cookies antigos e força reassinar

---

_Documento atualizado 2026-07-23 (revisão 3). Última mudança: modelo virou assinatura mensal, foco em vender resultado (fotos), não prompts._
