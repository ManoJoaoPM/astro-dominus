"use client";

import { useState, useEffect, useRef, useMemo, use } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "@discovery-solutions/struct/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Filter, 
  Pin, 
  PinOff, 
  User, 
  Clock, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  MoreVertical,
  Calendar,
  Phone,
  MessageSquare,
  RefreshCw
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";

export default function WhatsAppInboxPage({ params: paramsPromise }: { params: Promise<{ clientId: string; instanceId: string }> }) {
  const { clientId, instanceId } = use(paramsPromise);

  // State
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("all");
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch Conversations
  const { data: conversationsData, mutate: mutateConversations } = useSWR<any>(
    `/api/whatsapp/conversations?instanceId=${instanceId}&limit=100`, 
    fetcher,
    { 
      refreshInterval: 10000,
    }
  );

  const threads = useMemo(() => {
    if (!conversationsData?.data) return [];
    
    return conversationsData.data
      .filter((t: any) => {
        const matchesSearch = t.contactName?.toLowerCase().includes(search.toLowerCase()) || 
                            t.remoteJid.includes(search);
        const matchesOrigin = filterOrigin === "all" || t.source === filterOrigin;
        const matchesPinned = !onlyPinned || t.isPinned;
        return matchesSearch && matchesOrigin && matchesPinned;
      })
      .sort((a: any, b: any) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
  }, [conversationsData, search, filterOrigin, onlyPinned]);

  const selectedThread = useMemo(() => 
    threads.find((t: any) => t._id === selectedThreadId), 
    [threads, selectedThreadId]
  );

  const handlePin = async (id: string, currentStatus: boolean) => {
    try {
      await fetcher(`/api/whatsapp/conversations/${id}`, {
        method: "PATCH",
        body: { isPinned: !currentStatus }
      });
      mutateConversations();
      toast.success(currentStatus ? "Conversa desafixada" : "Conversa fixada");
    } catch {
      toast.error("Erro ao atualizar conversa");
    }
  };

  const handleUpdateOrigin = async (id: string, origin: string) => {
    try {
      await fetcher(`/api/whatsapp/conversations/${id}`, {
        method: "PATCH",
        body: { source: origin }
      });
      mutateConversations();
      toast.success("Origem atualizada");
    } catch {
      toast.error("Erro ao atualizar origem");
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await fetcher(`/api/whatsapp/instances/${instanceId}/sync`, { method: "POST" });
      mutateConversations();
      toast.success("Sincronização concluída");
    } catch {
      toast.error("Erro ao sincronizar");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden border-t">
      {/* Sidebar: Threads List */}
      <div className="w-[350px] border-r flex flex-col bg-slate-50/50">
        <div className="p-4 space-y-4 bg-white border-b">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href={`/dashboard/clients/${clientId}/whatsapp`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="font-bold flex-1">Conversas</h1>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 ${isSyncing ? "animate-spin" : ""}`}
              onClick={handleSync}
              disabled={isSyncing}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar contato ou número..." 
              className="pl-8 bg-slate-50 border-none h-9" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 items-center">
            <Select value={filterOrigin} onValueChange={setFilterOrigin}>
              <SelectTrigger className="h-8 text-[11px] bg-slate-50 border-none">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Origens</SelectItem>
                <SelectItem value="Orgânico">Orgânico</SelectItem>
                <SelectItem value="Google Ads">Google Ads</SelectItem>
                <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                <SelectItem value="Não identificado">Não identificado</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant={onlyPinned ? "default" : "outline"} 
              size="sm" 
              className="h-8 text-[11px]"
              onClick={() => setOnlyPinned(!onlyPinned)}
            >
              <Pin className="w-3 h-3 mr-1" /> Fixados
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="divide-y divide-slate-100">
            {threads.map((thread: any) => (
              <div 
                key={thread._id}
                onClick={() => setSelectedThreadId(thread._id)}
                className={`p-4 cursor-pointer hover:bg-white transition-colors relative ${
                  selectedThreadId === thread._id ? "bg-white shadow-sm z-10" : ""
                }`}
              >
                {selectedThreadId === thread._id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}
                
                <div className="flex justify-between items-start mb-1 gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-slate-400">
                      {thread.profilePicUrl ? (
                        <img src={thread.profilePicUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={14} />
                      )}
                    </div>
                    <span className="font-semibold truncate text-sm">
                      {thread.contactName || thread.remoteJid.split("@")[0]}
                    </span>
                    {thread.isPinned && <Pin className="h-3 w-3 text-primary fill-primary flex-shrink-0" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatTime(thread.lastMessageAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-normal bg-white">
                    {thread.source}
                  </Badge>
                  {thread.unreadCount > 0 && (
                    <Badge className="text-[9px] px-1 py-0 h-4 bg-primary text-primary-foreground">
                      {thread.unreadCount}
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground truncate italic">
                  {thread.lastMessagePreview || "Nenhuma mensagem registrada."}
                </p>
              </div>
            ))}
            {threads.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm italic">
                Nenhuma conversa encontrada.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content: Chat View */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedThread ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between bg-white z-20 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-slate-400">
                  {selectedThread.profilePicUrl ? (
                    <img src={selectedThread.profilePicUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-sm leading-none mb-1">
                    {selectedThread.contactName || selectedThread.remoteJid.split("@")[0]}
                  </h2>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {selectedThread.remoteJid.split("@")[0]}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground">Origem:</span>
                  <Select 
                    value={selectedThread.source} 
                    onValueChange={(val) => handleUpdateOrigin(selectedThread._id, val)}
                  >
                    <SelectTrigger className="h-8 text-[11px] w-[140px] bg-slate-50 border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Orgânico">Orgânico</SelectItem>
                      <SelectItem value="Google Ads">Google Ads</SelectItem>
                      <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                      <SelectItem value="Não identificado">Não identificado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => handlePin(selectedThread._id, selectedThread.isPinned)}
                >
                  {selectedThread.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <ChatMessages threadId={selectedThread._id} />

            {/* Read-Only Notice */}
            <div className="p-3 bg-slate-50 border-t text-center">
              <p className="text-[11px] text-muted-foreground italic flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                Modo Somente Leitura — Registro via Evolution API
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
              <MessageSquare size={32} />
            </div>
            <p className="text-sm italic">Selecione uma conversa para visualizar as mensagens.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Chat Messages Component with Infinite Scroll
function ChatMessages({ threadId }: { threadId: string }) {
  const PAGE_SIZE = 50;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  const { data: pages, size, setSize, isValidating } = useSWRInfinite<any>(
    (index, previousPageData) => {
      const previousMessages = index > 0 ? (previousPageData?.data ?? []) : [];
      const before =
        index > 0 && previousMessages.length > 0
          ? previousMessages[previousMessages.length - 1].timestamp
          : null;

      return `/api/whatsapp/messages?conversationId=${threadId}&limit=${PAGE_SIZE}${before ? `&before=${before}` : ""}`;
    },
    fetcher,
    {
      revalidateFirstPage: true,
      refreshInterval: 5000,
    }
  );

  const messages = useMemo(() => {
    if (!pages) return [];
    // Flatten and sort messages by timestamp ascending for display
    return pages.flatMap((p: any) => p.data ?? []).sort((a: any, b: any) => a.timestamp - b.timestamp);
  }, [pages]);

  // Scroll to bottom on initial load or new messages (if already at bottom)
  useEffect(() => {
    if (shouldScrollToBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, shouldScrollToBottom]);

  // Detect manual scroll to disable auto-scroll to bottom
  const handleScroll = (e: any) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldScrollToBottom(isAtBottom);

    // Load more if at top
    if (scrollTop === 0 && !isValidating && messages.length >= size * PAGE_SIZE) {
      setSize(size + 1);
    }
  };

  if (!pages && isValidating) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 bg-slate-50/30" onScroll={handleScroll} ref={scrollRef}>
      <div className="p-6 space-y-4">
        {isValidating && size > 1 && (
          <div className="text-center p-2">
            <Loader2 className="animate-spin h-4 w-4 mx-auto text-muted-foreground" />
          </div>
        )}
        
        {messages.map((msg: any, i: number) => {
          const isOutbound = msg.direction === "outbound";
          const showDate = i === 0 || !isSameDay(messages[i-1].timestamp, msg.timestamp);
          
          return (
            <div key={msg._id} className="space-y-4">
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="text-[10px] bg-white border px-2 py-0.5 rounded-full text-muted-foreground font-medium uppercase tracking-wider">
                    {formatDate(msg.timestamp)}
                  </span>
                </div>
              )}
              
              <div className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                <div 
                  className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                    isOutbound 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-white border text-slate-800 rounded-tl-none"
                  }`}
                >
                  {msg.messageType !== "text" && (
                    <div className="mb-1 text-[10px] font-bold uppercase opacity-60 flex items-center gap-1">
                      {msg.messageType === "image" && "📷 Imagem"}
                      {msg.messageType === "video" && "🎥 Vídeo"}
                      {msg.messageType === "audio" && "🎤 Áudio"}
                      {msg.messageType === "document" && "📄 Documento"}
                    </div>
                  )}

                  {msg.messageType === "audio" && msg.mediaUrl ? (
                    <div className="mt-1">
                      <audio controls preload="none" src={msg.mediaUrl} className="w-[260px] max-w-full" />
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {msg.content || (msg.mediaMeta?.filename ? `Arquivo: ${msg.mediaMeta.filename}` : "Mídia enviada")}
                    </p>
                  )}

                  <div className={`text-[9px] mt-1 flex items-center justify-end gap-1 opacity-70`}>
                    <Clock size={10} />
                    {format(new Date(msg.timestamp * 1000), "HH:mm")}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {messages.length === 0 && !isValidating && (
          <div className="text-center py-20 text-muted-foreground italic text-sm">
            Nenhuma mensagem neste período.
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// Helpers
function formatTime(date: any) {
  if (!date) return "";
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd/MM");
}

function formatDate(timestamp: number) {
  const d = new Date(timestamp * 1000);
  if (isToday(d)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return format(d, "d 'de' MMMM", { locale: ptBR });
}

function isSameDay(t1: number, t2: number) {
  const d1 = new Date(t1 * 1000);
  const d2 = new Date(t2 * 1000);
  return d1.toLocaleDateString() === d2.toLocaleDateString();
}
