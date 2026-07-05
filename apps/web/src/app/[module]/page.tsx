import Link from "next/link";
import { notFound } from "next/navigation";
import { getModule, moduleIds } from "@mgcc/shared";

export function generateStaticParams() {
  return moduleIds().map((id) => ({ module: id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: moduleId } = await params;
  const mod = getModule(moduleId);
  return {
    title: mod ? `${mod.name} — MGCC` : "Not found — MGCC",
  };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: moduleId } = await params;
  const mod = getModule(moduleId);
  if (!mod) notFound();

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-slate-400 hover:text-brand-fg">
        &larr; Command Center
      </Link>

      <div className="flex items-center gap-4">
        <span className="text-4xl" aria-hidden>
          {mod.icon}
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{mod.name}</h1>
          <p className="text-slate-400">{mod.description}</p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-white/15 bg-brand-panel p-8 text-center">
        <p className="text-slate-300">
          The <span className="font-medium">{mod.name}</span> module is
          scaffolded and ready for development.
        </p>
        <p className="mt-1 text-sm text-slate-500">Status: {mod.status}</p>
      </div>
    </div>
  );
}
