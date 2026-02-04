"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@discovery-solutions/struct/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, User, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChatPage({ params }: { params: { clientId: string; phone: string } }) {
  const { clientId, phone } = params;
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Get Instance
  const { data: instances } = useSWR<any>(`/api/whatsapp/instances?clientId=${clientId}`, fetcher);
  const instanceId = instances?.data?.[0]?._id;

  // 2. Get Conversation
  const remoteJid = `${phone}@s.whatsapp.net`;
  const { data: conversations } = useSWR<any>(
    instanceId ? `/api/whatsapp/conversations?instanceId=${instanceId}&remoteJid=${remoteJid}` : null, 
    fetcher
  );
  const conversation = conversations?.data?.[0];

  // 3. Get Messages
  const { data: messagesData } = useSWR<any>(
    conversation?._id ? `/api/whatsapp/messages?conversationId=${conversation._id}` : null,
    fetcher,
    { refreshInterval: 5000 } // Poll for new messages
  );
  console.log(messagesData)
  const messages = messagesData?.data || [];

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!instanceId) return <div className="p-10">Carregando...</div>;
  if (!conversation) return <div className="p-10">Conversa não encontrada.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/clients/${clientId}/whatsapp/conversations`}>
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
            <User size={20} />
          </div>
          <div>
            <h2 className="font-semibold">{conversation.contactName || phone}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{phone}</span>
              <Badge variant="outline" className="text-[10px] h-5">{conversation.source}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           {conversation.tags.map((tag: string) => (
             <Badge key={tag} variant="secondary">{tag}</Badge>
           ))}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 pb-4">
          {messages.map((msg: any) => {
            const isMe = msg.key.fromMe;
            return (
              <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div 
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isMe ? "bg-primary text-primary-foreground" : "bg-white border shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  
                  {/* Analysis Badge (Internal only) */}
                  {msg.analysis?.intent && msg.analysis.intent !== "general" && !isMe && (
                    <div className="mt-2 pt-2 border-t border-black/10 flex items-center gap-1 text-[10px] opacity-70">
                      <BrainCircuit size={12} />
                      <span>Intenção: {msg.analysis.intent}</span>
                    </div>
                  )}

                  <div className={`text-[10px] mt-1 text-right ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {format(new Date(Number(msg.timestamp) * 1000), "HH:mm")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
