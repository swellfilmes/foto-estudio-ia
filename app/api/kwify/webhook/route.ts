import { NextRequest, NextResponse } from "next/server";
import { markCanceled, upsertSubscriber } from "@/lib/db";

// Kwify assina o webhook via query param `?signature=<token>` (configurado no painel).
// Aceita header como fallback.
function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.KWIFY_WEBHOOK_SECRET;
  if (!expected) return false;
  const url = new URL(req.url);
  const provided =
    url.searchParams.get("signature") ||
    req.headers.get("x-kiwify-signature") ||
    req.headers.get("x-signature") ||
    "";
  if (!provided) return false;
  // Compara em tempo constante (mesmo comprimento) via strings.
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

type KwifyOrder = {
  webhook_event_type?: string;
  order_status?: string;
  order_id?: string;
  order_ref?: string;
  subscription_id?: string;
  approved_date?: string;
  refunded_at?: string | null;
  Customer?: { email?: string; full_name?: string };
  Subscription?: {
    start_date?: string;
    next_payment?: string;
    end_date?: string;
    status?: string;
    customer_access?: { access_until?: string; has_access?: boolean };
  };
  Product?: { product_name?: string; product_id?: string };
};

// A Kwify envia o payload em duas formas possíveis:
//   { order: {...} }         (formato atual, com assinatura no body/query)
//   { ...campos direto }     (formato legado / alguns eventos)
// Aceita as duas.
type KwifyPayload = { order?: KwifyOrder } & KwifyOrder;

function parseDate(s: string | undefined | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    console.warn("[kwify/webhook] assinatura inválida");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: KwifyPayload;
  try {
    body = (await req.json()) as KwifyPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Log completo pra você inspecionar o payload real da Kwify e ajustar mapeamentos.
  console.log("[kwify/webhook] event:", JSON.stringify(body));

  // A Kwify aninha os dados dentro de `order`. Fallback pro nível raiz caso venha diferente.
  const o: KwifyOrder = body.order ?? body;
  const event = String(o.webhook_event_type || o.order_status || "").toLowerCase();
  const email = o.Customer?.email?.trim().toLowerCase();
  const name = o.Customer?.full_name?.trim() || null;
  const kwifyCustomerId = o.subscription_id || null;
  const nextPayment =
    parseDate(o.Subscription?.next_payment) ||
    parseDate(o.Subscription?.customer_access?.access_until) ||
    parseDate(o.Subscription?.end_date);

  if (!email) {
    console.warn("[kwify/webhook] payload sem email:", event);
    return NextResponse.json({ ok: true, ignored: "no-email" });
  }

  // Aprovação de compra ou renovação → ativa
  if (
    event.includes("approved") ||
    event.includes("paid") ||
    event.includes("renewed") ||
    event.includes("completed")
  ) {
    await upsertSubscriber({
      email,
      name,
      status: "active",
      source: "kwify",
      kwify_customer_id: kwifyCustomerId,
      subscription_ends_at: nextPayment, // opcional; útil pra dashboards
    });
    return NextResponse.json({ ok: true, action: "activated" });
  }

  // Reembolso ou chargeback → bloqueio imediato
  if (event.includes("refund") || event.includes("chargeback")) {
    await markCanceled(email, new Date(), "refunded");
    return NextResponse.json({ ok: true, action: "refunded" });
  }

  // Cancelamento voluntário → mantém acesso até o fim do ciclo pago
  if (event.includes("cancel")) {
    // Se a Kwify não mandar data, encerra em 30 dias como aproximação segura
    const fallback = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await markCanceled(email, nextPayment ?? fallback, "canceled");
    return NextResponse.json({ ok: true, action: "canceled-end-of-cycle" });
  }

  // Atraso, boleto gerado, PIX pendente, etc — apenas registra.
  return NextResponse.json({ ok: true, ignored: event || "unknown" });
}

// GET pra teste manual do endpoint
export async function GET() {
  return NextResponse.json({ ok: true, note: "kwify webhook alive" });
}
