"use client";
import { fetcher } from "@discovery-solutions/struct";
import { useQuery } from "@tanstack/react-query";
import {
  IconTrendingDown,
  IconTrendingUp,
  IconUserCheck,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  CardDescription,
  CardAction,
  CardFooter,
  CardHeader,
  CardTitle,
  Card,
} from "@/components/ui/card";

export function SectionCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetcher("/api/dashboard"),
    refetchInterval: 1000 * 60 * 2, // 2 minutos
  });

  const stats = [
    {
      title: "Usuários Totais",
      value: isLoading ? "..." : data?.users?.total?.toLocaleString("pt-BR") ?? "-",
      change: isLoading
        ? "-"
        : `${data?.users?.growth > 0 ? "+" : ""}${data?.users?.growth}%`,
      trendingUp: (data?.users?.growth ?? 0) >= 0,
      footer: "Novos usuários este mês",
      icon: <IconUsers className="size-5" />,
    },
    {
      title: "Usuários Ativos",
      value: isLoading ? "..." : data?.users?.active?.toLocaleString("pt-BR") ?? "-",
      change: isLoading ? "-" : "+3.4%", // exemplo fixo; pode calcular com base futura
      trendingUp: true,
      footer: "Atividade semanal consistente",
      icon: <IconUserCheck className="size-5" />,
    },
    {
      title: "Leads Totais",
      value: isLoading ? "..." : data?.leads?.total?.toLocaleString("pt-BR") ?? "-",
      change: "-", // se quiser podemos colocar crescimento depois
      trendingUp: true,
      footer: "Total cadastrado no sistema",
      icon: <IconUserPlus className="size-5" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 px-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {stats.map((s) => (
        <Card
          key={s.title}
          className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card"
        >
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              {s.icon}
              {s.title}
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {s.value}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="flex items-center gap-1">
                {s.trendingUp ? (
                  <IconTrendingUp className="size-4" />
                ) : (
                  <IconTrendingDown className="size-4" />
                )}
                {s.change}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex gap-2 font-medium">
              {s.trendingUp ? "Em alta" : "Em queda"}{" "}
              {s.trendingUp ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
            </div>
            <div className="text-muted-foreground">{s.footer}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
