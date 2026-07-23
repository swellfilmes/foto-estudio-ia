# Plano de tarde — 2026-07-23

**Objetivo do dia:** deixar o app rodando pronto pra receber usuário + começar a materializar o produto vendável.

---

## Onde a gente está agora (snapshot)

### App (código)
- App Next.js já no ar no Vercel (projeto `app` sob a conta Swell Filmes)
- **Modo Produto** completo: upload da foto → análise Claude → prompt EN → 4 imagens Nano Banana
- **Modo Pessoas / Roupa** implementado hoje: 8 categorias (studio, ghost mannequin, flat lay, modelo estúdio, modelo lifestyle, produto na mão, UGC/selfie, campanha editorial) × 2 estilos (realista, render 3D)
- **Gate de acesso** implementado hoje: landing em `/` captura nome + e-mail antes de liberar `/studio`
- Todo lead é gravado localmente em `data/leads.json` e nos logs da Vercel

### Materiais escritos (Markdown, ainda não materializados)
- `nucleo/` — fundamentos, regra de ouro, trava de produto, anti-IA, 6 prompts
- `pack-chatgpt/` — como usar, limites, correção de tom amarelado
- `pack-nano-banana/` — créditos, modelos, pipeline de fidelidade
- `fase3-lancamento/` — Notion, FAQ, checkout Kiwify, carrossel Instagram, outreach

### O que ainda falta pra vender
1. Deploy da versão nova no Vercel (5 min — João)
2. Notion duplicável do pack (~2h — sócia)
3. Kiwify configurado com produtos + checkout + order bump (~1.5h — sócia)
4. Ativos antes/depois pro carrossel de vendas (~1h — juntos)
5. Página de vendas apontando para o Kiwify (opcional pro hoje — sócia depois)

---

## Divisão de papéis

| Papel | Pessoa | Foco |
|---|---|---|
| **Dev + Testes técnicos** | João | Junto com Claude, integra código, testa fluxo, deploya, monitora erros |
| **Produto + Vendas** | Sócia | Materializa Notion, configura Kiwify, prepara ativos e outreach |
| **Testes de conteúdo (juntos)** | João + sócia | Rodar o app com produtos reais e escolher os pares antes/depois pro carrossel |

**Como funciona a colaboração hoje:**
- **Duas frentes em paralelo**, sem depender uma da outra
- **Check-in a cada 1h30** (às 15h, 16h30, 18h) — cada um mostra o que fez, alinha próximo bloco
- **Fim do dia (19h–20h):** rodada final de ativos juntos, definir data de lançamento

---

## Frente 1 — João (dev)

### Bloco 1.1 · Deploy do que já está pronto — 15 min
- [ ] Fazer commit único das mudanças de hoje (gate + módulo pessoas)
- [ ] `git push origin main` para o repo (o Vercel deploya sozinho)
- [ ] Confirmar que o build passou no Vercel
- [ ] Testar o URL de produção com o próprio e-mail (nome + e-mail → estúdio)
- [ ] Compartilhar o URL com a sócia

**Critério de "pronto":** URL de produção abre a landing, aceita e-mail e libera o estúdio nos dois modos.

### Bloco 1.2 · Rodar 3 testes reais de produto — 30 min
- [ ] Pegar 3 produtos físicos diferentes (ex: 1 cosmético, 1 alimento/bebida, 1 acessório)
- [ ] Fotografar cada um com o celular, seguindo `nucleo/pre-checagem.md`
- [ ] Rodar cada foto no Modo Produto, gerar 4 variações
- [ ] Salvar as 4 melhores em `assets/produto/` (criar pasta se não existir)
- [ ] Anotar quais tipos de foto (fundo limpo, lifestyle...) ficaram melhores por categoria

**Critério de "pronto":** 12 imagens geradas totais (3 produtos × 4 variações), salvas com nome que identifica a categoria.

### Bloco 1.3 · Rodar 3 testes reais de peça de roupa — 30 min
- [ ] Pegar 3 peças (ideal: 1 camiseta, 1 moletom ou vestido, 1 peça com estampa)
- [ ] Fotografar cada uma sozinha (plana ou em cabide, boa luz)
- [ ] Modo Pessoas → gerar 1 versão de cada em duas categorias (ex: `studio` + `model-studio`)
- [ ] Salvar em `assets/pessoas/`
- [ ] Anotar Style Strengths que precisaram ser ajustados

**Critério de "pronto":** 24 imagens (3 peças × 2 categorias × 4 variações), com anotação de qualidade.

### Bloco 1.4 · Ajustes de UX descobertos durante teste — 45 min
Vai depender do que rodou. Coisas prováveis:
- [ ] Melhorar mensagens de erro (crédito Magnific acabou, foto ruim, etc)
- [ ] Adicionar botão "Copiar todas as imagens em URL" pra ficar fácil colar no WhatsApp
- [ ] Adicionar contador de "quantas fotos você já gerou hoje" (visual pro usuário)
- [ ] Adicionar tela de "seu link de download expira em 24h" (limitação Magnific)

**Critério de "pronto":** todos os bugs de UX que aparecerem no bloco 1.2/1.3 resolvidos.

---

## Frente 2 — Sócia (produto + vendas)

Toda a especificação está em `fase3-lancamento/`. Este bloco é execução, não decisão.

### Bloco 2.1 · Montar Notion duplicável — ~2h
Base: `fase3-lancamento/notion-estrutura.md`

- [ ] Criar página no Notion: **Pack Foto Estúdio IA — ChatGPT**
- [ ] Estrutura da página conforme o MD (Comece aqui, Pré-checagem, Regra de ouro, Trava, 6 tipos de foto, Como usar, Galeria, FAQ)
- [ ] Colar o conteúdo de cada seção vindo de `nucleo/` + `pack-chatgpt/`
- [ ] Cada um dos 6 tipos de foto vira uma seção colapsável (toggle)
- [ ] Configurar compartilhamento como "Duplicate to Notion" (public → duplicate ativado)
- [ ] **Duplicar tudo** e criar a versão **Pack Foto Estúdio IA — Nano Banana** trocando o conteúdo `pack-chatgpt/` por `pack-nano-banana/`
- [ ] Anotar os 2 links de duplicação (vão no Kiwify)

**Critério de "pronto":** 2 links Notion públicos, ambos duplicáveis, testados em navegador anônimo.

### Bloco 2.2 · Configurar Kiwify — ~1.5h
Base: `fase3-lancamento/checkout.md`

- [ ] Criar conta no Kiwify (se não tiver)
- [ ] Cadastrar produto **Pack ChatGPT** — R$27 de lançamento (de R$37) — entrega: link Notion (do bloco 2.1)
- [ ] Cadastrar produto **Pack Nano Banana** — R$67 de lançamento (de R$97) — entrega: link Notion
- [ ] Ativar **order bump** no checkout do Pack ChatGPT: "Adicionar Pack NB por R$47" (texto no MD)
- [ ] Ativar **OTO** pós-compra (One Time Offer) — texto no MD
- [ ] Configurar e-mail automático pós-compra usando o template do MD
- [ ] Configurar garantia 7 dias em ambos
- [ ] Testar o checkout em navegador anônimo (não precisa pagar — Kiwify tem modo teste)

**Critério de "pronto":** dois links de checkout funcionando, order bump aparece, e-mail chega.

### Bloco 2.3 · Preparar carrossel Instagram (só o rascunho) — ~1h
Base: `fase3-lancamento/carrossel-instagram.md`

- [ ] Abrir Canva ou Figma
- [ ] Criar 3 templates de slide vazios (usando as cores da marca — laranja `#c87941` + fundo escuro)
- [ ] Deixar prontos os slides 1 a 5 do **Carrossel 1 (Antes/Depois)** — as imagens dos slides 2/3/4/5 entram no bloco 3 (juntos)
- [ ] Escrever o texto dos slides 1 do **Carrossel 2 (Educativo)** e do **Carrossel 3 (Oferta)**

**Critério de "pronto":** 3 arquivos Canva/Figma com estrutura pronta, aguardando as imagens antes/depois.

---

## Frente 3 — Juntos (fim da tarde)

### Bloco 3 · Rodada final: ativos antes/depois — ~1h
Depende dos blocos 1.2, 1.3 e 2.3 estarem prontos.

- [ ] Escolher os 3 pares mais fortes (celular original × imagem gerada) — cobrindo 3 categorias diferentes
- [ ] Combinar com a sócia qual foto vai em qual slide do Carrossel 1
- [ ] Sócia insere as imagens no Canva
- [ ] Revisar juntos os 3 carrosséis
- [ ] Definir data de postagem do Carrossel 1 (recomendado: primeiro dia útil pós-lançamento)

**Critério de "pronto":** 3 carrosséis prontos pra postar, com data definida.

### Bloco 4 · Alinhamento final — 15 min
- [ ] Data de lançamento definida (recomendado: 3 a 5 dias depois de hoje, tempo pra revisar tudo com cabeça fria)
- [ ] Definir quem vai fazer outreach de que perfil (usando `fase3-lancamento/outreach.md`)
- [ ] Meta da semana 1: 20 contatos individuais + 3 posts orgânicos
- [ ] Configurar tracking (Vercel Analytics grátis ativa por padrão + printscreen dos leads gravados)

**Critério de "pronto":** data marcada + próxima semana planejada.

---

## Cronograma sugerido (~5h de trabalho ativo)

| Horário | João | Sócia |
|---|---|---|
| 14:00 – 14:15 | Bloco 1.1 · Deploy | Bloco 2.1 · Notion (começa) |
| 14:15 – 15:30 | Bloco 1.2 · Testes produto | Bloco 2.1 · Notion (continua) |
| **15:30 – 15:45** | **Check-in 1** — trocar status | |
| 15:45 – 16:15 | Bloco 1.3 · Testes pessoas | Bloco 2.1 · Notion (termina) |
| 16:15 – 16:45 | Bloco 1.4 · Ajustes UX | Bloco 2.2 · Kiwify (começa) |
| **16:45 – 17:00** | **Check-in 2** — mostrar Notion + Kiwify | |
| 17:00 – 17:45 | Bloco 1.4 · Ajustes UX (continua) | Bloco 2.2 · Kiwify (termina) |
| 17:45 – 18:15 | Deploy final | Bloco 2.3 · Templates carrossel |
| **18:15 – 19:15** | **Bloco 3 juntos** — carrossel + ativos | |
| **19:15 – 19:30** | **Bloco 4 juntos** — alinhamento final | |

---

## Checklist final do dia (o que precisa estar de pé às 19:30)

- [ ] App em produção com gate + modo produto + modo pessoas funcionando
- [ ] 3 leads de teste (nomes seus mesmo) nos logs pra confirmar captura
- [ ] Notion duplicável do Pack ChatGPT publicado
- [ ] Notion duplicável do Pack Nano Banana publicado
- [ ] 2 produtos cadastrados no Kiwify com checkout funcional
- [ ] Order bump + OTO + e-mail pós-compra ativados
- [ ] 3 carrosséis com estrutura pronta + imagens dos 3 pares antes/depois inseridas
- [ ] Data de lançamento definida
- [ ] Plano da primeira semana de outreach definido

---

## Riscos e o que fazer se der ruim

**"O Kiwify pediu documentação e não liberou hoje"** → cadastro é imediato mas às vezes exigem CPF/CNPJ. Se travar, fazer o mesmo no **Hotmart** como plano B (`fase3-lancamento/checkout.md` compara os dois).

**"O Notion Duplicate to Template não aparece"** → verificar em Configurações do workspace se está no plano gratuito (funciona), OU trocar por link público simples e o comprador copia manualmente.

**"O app crashou / Magnific sem crédito"** → recarregar no https://magnific.com/billing. Enquanto isso, o app não trava — só o botão "Gerar fotos" que não vai funcionar.

**"Uma foto gerada saiu com o produto errado"** → é esperado em uma pequena porcentagem. Regenerar clicando "+ 4 novas variações". Se cair muitas vezes, revisar a foto de entrada (`nucleo/pre-checagem.md`).

---

## Contato + notas soltas

- **Repo do app:** este projeto (`SWELL LENS IA +/app`)
- **Deploy:** Vercel (projeto id `prj_zTSsSudxGDlVXP9ru0bGwDqy0cDB`)
- **APIs em uso:** Anthropic (análise de imagem) + Magnific (geração Nano Banana)
- **Custo do teste:** cada foto gerada usa ~1 crédito Magnific. 3 testes de produto × 4 variações = ~12 créditos. 3 testes de peça × 2 categorias × 4 variações = ~24 créditos. Total do dia: ~36 créditos.
- **E-mail dos leads:** por enquanto grava em `data/leads.json` (local) + logs Vercel. Se quiser dashboard, próximo passo é ligar num Google Sheet via webhook — leva 20 min.

---

_Documento gerado em 2026-07-23 no início da tarde de trabalho. Atualizem quando fecharem cada bloco._
