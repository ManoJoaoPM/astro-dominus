"use client";

import { TableView } from "@discovery-solutions/struct/client";
import { fetcher } from "@discovery-solutions/struct/client";
import useSWR from "swr";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const columns = [
  { 
    header: "Contato", 
    cell: ({ row }: any) => (
      <div>
        <div className="font-medium">{row.original.contactName || row.original.remoteJid.split("@")[0]}</div>
        <div className="text-xs text-muted-foreground">{row.original.remoteJid.split("@")[0]}</div>
      </div>
    )
  },
  { 
    header: "Última Mensagem", 
    cell: ({ row }: any) => (
      <div className="max-w-[300px] truncate text-sm text-muted-foreground">
        {row.original.lastMessageContent || "Sem mensagens"}
      </div>
    )
  },
  { 
    header: "Data", 
    accessorKey: "lastMessageAt",
    cell: ({ row }: any) => row.original.lastMessageAt ? format(new Date(row.original.lastMessageAt), "dd/MM HH:mm", { locale: ptBR }) : "-"
  },
  { 
    header: "Origem", 
    accessorKey: "source",
    cell: ({ row }: any) => {
      const map: any = {
        unknown: "Não informado",
        meta_ads: "Meta Ads",
        google_ads: "Google Ads"
      };
      return <Badge variant="outline">{map[row.original.source] || row.original.source}</Badge>;
    }
  },
  {
    header: "Tags",
    cell: ({ row }: any) => (
      <div className="flex gap-1 flex-wrap">
        {row.original.tags?.map((tag: string) => (
          <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
        ))}
      </div>
    )
  },
  {
    id: "actions",
    cell: ({ row }: any) => (
      <Button variant="ghost" size="sm" asChild>
        <a href={`conversations/${row.original.remoteJid.split("@")[0]}`}>
          <MessageCircle className="w-4 h-4 mr-2" /> Ver
        </a>
      </Button>
    )
  }
];

export default function ConversationListPage({ params }: { params: { clientId: string } }) {
  const { clientId } = params;
  
  // 1. Get Instance ID
  const { data: instances } = useSWR<any>(`/api/whatsapp/instances?clientId=${clientId}`, fetcher);
  
  if (!instances) {
    return <div className="p-8 text-center text-muted-foreground">Aguarde um instância do WhatsApp ser carregada.</div>;
  }
  
  const list = instances?.data || instances || [];
  const instance = list[0];
  const instanceId = instance?._id;

  if (!instanceId) {
    return <div className="p-8 text-center text-muted-foreground">Conecte o WhatsApp primeiro.</div>;
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Conversas</h1>
      <TableView
        endpoint={`whatsapp/conversations?instanceId=${instanceId}`}
        columns={columns}
        hideAdd
      />
    </div>
  );
}
