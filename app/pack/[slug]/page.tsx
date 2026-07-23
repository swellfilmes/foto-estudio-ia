import { notFound } from "next/navigation";
import PackShell from "@/components/pack/PackShell";
import type { PackSlug } from "@/lib/pack-prompts";

const VALID_SLUGS: PackSlug[] = ["chatgpt", "nano-banana"];

export default async function PackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!VALID_SLUGS.includes(slug as PackSlug)) notFound();
  return <PackShell slug={slug as PackSlug} />;
}
