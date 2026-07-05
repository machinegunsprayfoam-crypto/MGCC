import Link from "next/link";
import type { PlatformModule, ModuleStatus } from "@mgcc/shared";

const STATUS_STYLES: Record<ModuleStatus, string> = {
  live: "bg-emerald-500/15 text-emerald-300",
  beta: "bg-amber-500/15 text-amber-300",
  planned: "bg-white/10 text-slate-400",
};

const STATUS_LABEL: Record<ModuleStatus, string> = {
  live: "Live",
  beta: "Beta",
  planned: "Planned",
};

export function ModuleCard({ module }: { module: PlatformModule }) {
  return (
    <Link
      href={`/${module.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-white/10 bg-brand-panel p-5 transition hover:border-brand/50 hover:bg-white/[0.03]"
    >
      <div className="flex items-start justify-between">
        <span className="text-3xl" aria-hidden>
          {module.icon}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[module.status]}`}
        >
          {STATUS_LABEL[module.status]}
        </span>
      </div>
      <div>
        <h2 className="font-semibold text-slate-100 group-hover:text-brand-fg">
          {module.name}
        </h2>
        <p className="mt-1 text-sm text-slate-400">{module.description}</p>
      </div>
    </Link>
  );
}
