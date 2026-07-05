import { MODULES } from "@mgcc/shared";
import { ModuleCard } from "@/components/ModuleCard";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Command Center</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          The unified operating platform for Machine Gun Spray Foam &amp;
          Concrete Lifting. Every part of the business — from the first lead to
          the final invoice — runs from here.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </section>
    </div>
  );
}
