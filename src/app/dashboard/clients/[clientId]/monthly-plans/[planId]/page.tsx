"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { MonthlyPlanInterface, MONTH_NAMES } from "@/models/socialmedia/monthly-plan/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MonthlyPlanDetailPage() {
  const params = useParams();
  const { clientId, planId } = useParams() as { clientId: string; planId: string };

  const { data, isLoading } = useSWR<MonthlyPlanInterface>(
    `monthly-plan/${planId}`,
    fetcher
  );

  if (isLoading || !data) {
    return <p>Carregando planejamento...</p>;
  }

  const title = `${MONTH_NAMES[data.month - 1]} / ${data.year}`;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Planejamento – {title}</h1>
      <p className="text-sm text-muted-foreground">
        Aqui você pode evoluir para uma interface de calendário e vincular dias às linhas editoriais e pautas.
      </p>

      <pre className="rounded-md border bg-muted p-4 text-xs">
        {JSON.stringify(data.items, null, 2)}
      </pre>
    </div>
  );
}
