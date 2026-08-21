import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { getUsageContext, debitPhoto, refundPhoto } from "@/lib/db";

// Modelo do Magnific. "nano-banana-pro" = qualidade máxima (mais créditos, ~mais lento).
// Alternativa mais barata/rápida: "nano-banana-pro-flash".
const MAGNIFIC_MODEL = "nano-banana-pro";
const MAGNIFIC_URL = `https://api.magnific.com/v1/ai/text-to-image/${MAGNIFIC_MODEL}`;

// Aspect ratio por tipo de foto de PRODUTO (modo Produto).
// Ensaio passa aspectRatio direto no body.
const PRODUCT_ASPECT_RATIO_MAP: Record<string, string> = {
  "fundo-limpo": "1:1",
  lifestyle: "4:5",
  segurando: "2:3",
  "flat-lay": "1:1",
  macro: "1:1",
  "ghost-mannequin": "2:3",
};

export async function POST(req: NextRequest) {
  const key = process.env.MAGNIFIC_API_KEY;
  if (!key) return NextResponse.json({ error: "API key do Magnific não configurada" }, { status: 500 });

  // Paywall: guardamos se debitamos pra poder estornar se a geração falhar na hora.
  const payEmail = await getSessionEmail(req);
  let debited = false;

  // SEM SESSAO = SEM GERACAO.
  // Antes isso era fail-open e virou o buraco do trial: quem abria /studio sem
  // login nunca era debitado (o debito e por e-mail), e o contador da tela era
  // so estado do React — recarregar a pagina zerava e a pessoa gerava de novo,
  // infinitamente. A cota so existe se houver identidade pra amarrar nela.
  if (!payEmail) {
    return NextResponse.json(
      { error: "sem_sessao", message: "Entre com seu e-mail para gerar fotos." },
      { status: 401 }
    );
  }

  try {
    const {
      prompt,
      referenceImageBase64,
      referenceImagesBase64,     // produto e ensaio podem ter mais de 1 referência
      photoType = "fundo-limpo", // modo produto (fallback)
      aspectRatio: aspectOverride, // ensaio passa direto
      negativePrompt,
      styleStrength,
      referenceText,             // customiza a mensagem da referência ("keep the person...")
      referenceImageUrls,        // "Adicionar": a foto JÁ GERADA volta como referência (por URL)
      keepScene,                 // "Adicionar": manter a cena e mexer só no que foi pedido
    } = await req.json();

    if (!prompt) return NextResponse.json({ error: "Prompt obrigatório" }, { status: 400 });

    // ── Paywall: debita 1 foto da cota do usuário, de forma atômica ──
    // Cota null (assinante ativo ainda sem plano mapeado) = libera. Erro de banco também
    // libera, pra não travar pagante — mas SEM SESSÃO já foi barrado lá em cima.
    if (payEmail) {
      try {
        const usage = await getUsageContext(payEmail);
        if (usage.quota != null) {
          const ok = await debitPhoto(payEmail, usage.quota);
          if (!ok) {
            return NextResponse.json(
              { error: "limite_atingido", plano_atual: usage.plan, usado: usage.used, cota: usage.quota },
              { status: 402 }
            );
          }
          debited = true;
        }
      } catch (e) {
        console.error("[generate-images] paywall indisponível — liberando p/ não bloquear pagante:", e);
      }
    }

    // Magnific limita o prompt a 3000 caracteres — trava de segurança pra nunca dar 400.
    const MAX_PROMPT = 3000;
    const safePrompt = typeof prompt === "string" && prompt.length > MAX_PROMPT
      ? prompt.slice(0, MAX_PROMPT)
      : prompt;

    const aspectRatio = aspectOverride || PRODUCT_ASPECT_RATIO_MAP[photoType] || "1:1";

    const body: Record<string, unknown> = {
      prompt: safePrompt,
      aspect_ratio: aspectRatio,
      resolution: "1K",
    };

    if (negativePrompt && typeof negativePrompt === "string" && negativePrompt.trim()) {
      body.negative_prompt = negativePrompt.trim();
    }
    if (typeof styleStrength === "number" && styleStrength >= 0 && styleStrength <= 100) {
      body.style_strength = styleStrength;
    }

    // Suporta 1 ou N referências (produto e ensaio mandam array; 1 foto = retrocompatível)
    const refs: string[] = Array.isArray(referenceImagesBase64) && referenceImagesBase64.length
      ? referenceImagesBase64
      : referenceImageBase64
        ? [referenceImageBase64]
        : [];

    // "Adicionar": a imagem gerada chega como URL. Baixamos aqui no servidor em vez
    // de no navegador porque a URL do Magnific é de outro domínio — no cliente o
    // CORS barraria a leitura dos bytes.
    if (Array.isArray(referenceImageUrls) && referenceImageUrls.length) {
      const baixadas = await Promise.all(
        referenceImageUrls.slice(0, 3).map(async (u: string) => {
          try {
            const r = await fetch(u);
            if (!r.ok) return null;
            return Buffer.from(await r.arrayBuffer()).toString("base64");
          } catch { return null; }
        })
      );
      const ok = baixadas.filter(Boolean) as string[];
      if (ok.length === 0 && refs.length === 0) {
        if (debited) { try { await refundPhoto(payEmail); } catch { /* ignora */ } }
        return NextResponse.json({ error: "Não consegui carregar a imagem original" }, { status: 400 });
      }
      refs.unshift(...ok);
    }

    // Duas leituras opostas da mesma referência:
    //   padrão      → copie SÓ o produto, ignore o cenário (é uma cena nova)
    //   keepScene   → mantenha a cena inteira, mexa só no que o pedido diz
    const TEXTO_CONTINUAR =
      "This image is the scene to continue from. Keep its exact composition, camera angle, framing, lighting, colour grade, background and every existing element. Apply ONLY the change described in the prompt. Do not restyle, re-render or reinterpret the rest of the frame.";

    if (refs.length > 0) {
      const total = refs.length;
      body.reference_images = refs.map((b64: string, i: number) => ({
        image: `data:image/jpeg;base64,${b64}`,
        text: referenceText || (keepScene
          ? TEXTO_CONTINUAR
          : total > 1
            ? `Product reference ${i + 1} of ${total} — same physical product from another angle. Use ALL references only to reproduce the product's exact shape, color, label and materials. IGNORE the background/scene of every reference; the new scene is defined by the prompt, not by these photos.`
            : "Use this image only to reproduce the product's exact shape, color, label and materials. IGNORE its background/scene entirely; the new scene is defined by the prompt."),
        mime_type: "image/jpeg",
      }));
    }

    const res = await fetch(MAGNIFIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-magnific-api-key": key,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Magnific error:", data);
      // Falhou na hora → estorna a foto debitada (não cobra por geração que nem começou)
      if (debited && payEmail) { try { await refundPhoto(payEmail); } catch { /* ignora */ } }
      const detail = data?.invalid_params?.[0]?.reason;
      const msg = data?.message
        ? (detail ? `${data.message}: ${detail}` : data.message)
        : "Erro no Magnific";
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    const taskId = data?.data?.task_id || data?.task_id;
    return NextResponse.json({ task_id: taskId, raw: data });
  } catch (error) {
    console.error("Erro generate-images:", error);
    if (debited && payEmail) { try { await refundPhoto(payEmail); } catch { /* ignora */ } }
    return NextResponse.json({ error: "Erro ao gerar imagens" }, { status: 500 });
  }
}
