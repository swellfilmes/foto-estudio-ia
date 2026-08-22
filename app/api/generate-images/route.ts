import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { getUsageContext, debitPhoto, refundPhoto, bumpFreeIp } from "@/lib/db";

// Limite diário de fotos grátis anônimas por IP (rede de proteção anti-bot).
// Frouxo de propósito: várias pessoas podem dividir o mesmo IP (celular/escritório).
const DAILY_IP_FREE_LIMIT = 8;

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

  // GANCHO: quem NAO esta logado gera 1 foto gratis (marcada por cookie de aparelho).
  // Da 2a em diante, precisa entrar com o e-mail (ai ganha +3 no teste). Depois, so plano.
  // O cookie e forjavel/limpavel — de proposito: 1 foto e barata e serve de isca; o
  // controle real (cota) vive no banco, por e-mail.
  const FREE_COOKIE = "swl-free";
  let grantFree = false;
  if (!payEmail) {
    const usedFree = req.cookies.get(FREE_COOKIE)?.value === "1";
    if (usedFree) {
      return NextResponse.json(
        { error: "precisa_login", message: "Entre com seu e-mail pra gerar mais 3 fotos grátis." },
        { status: 401 }
      );
    }
    // Rede de proteção: mesmo limpando o cookie, o IP tem um teto diário.
    const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "").trim();
    const underIp = await bumpFreeIp(ip, DAILY_IP_FREE_LIMIT);
    if (!underIp) {
      return NextResponse.json(
        { error: "precisa_login", message: "Muitas fotos grátis nesta rede hoje. Entre com seu e-mail pra continuar." },
        { status: 401 }
      );
    }
    grantFree = true;
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
        if (debited && payEmail) { try { await refundPhoto(payEmail); } catch { /* ignora */ } }
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
    const okRes = NextResponse.json({ task_id: taskId, raw: data });
    if (grantFree) {
      // Este aparelho já usou a foto grátis (vale 180 dias).
      okRes.cookies.set({
        name: FREE_COOKIE, value: "1", httpOnly: true, sameSite: "lax",
        secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 180,
      });
    }
    return okRes;
  } catch (error) {
    console.error("Erro generate-images:", error);
    if (debited && payEmail) { try { await refundPhoto(payEmail); } catch { /* ignora */ } }
    return NextResponse.json({ error: "Erro ao gerar imagens" }, { status: 500 });
  }
}
