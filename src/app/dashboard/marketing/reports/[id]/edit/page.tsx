"use client";

import { useState, useEffect } from "react";
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { ReportBlockInterface } from "@/models/marketing/report-block";
import { BLOCK_TEMPLATES, BlockTemplate, METRIC_LABELS } from "@/constants/marketing/blocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, GripVertical, Trash2, Settings } from "lucide-react";
import { fetcher } from "@discovery-solutions/struct/client";
import useSWR from "swr";
import { toast } from "sonner";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// --- Configuration Sheet ---
function BlockConfigSheet({ 
  block, 
  isOpen, 
  onClose, 
  onSave 
}: { 
  block: ReportBlockInterface | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (blockId: string, config: any) => Promise<void>;
}) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const template = block ? BLOCK_TEMPLATES.find(t => t.id === block.templateId) : null;

  // Initialize state when block changes
  useEffect(() => {
    if (block) {
      setSelectedMetrics(block.config.metricsSelected || []);
    }
  }, [block, isOpen]);

  if (!block || !template) return null;

  const handleToggleMetric = (metricKey: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricKey) 
        ? prev.filter(k => k !== metricKey) 
        : [...prev, metricKey]
    );
  };

  const handleSave = async () => {
    await onSave(block._id!, { metricsSelected: selectedMetrics });
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Configurar Bloco</SheetTitle>
          <SheetDescription>
            {template.title} — Selecione as métricas que deseja exibir.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6">
          <h4 className="mb-4 text-sm font-medium">Métricas Disponíveis</h4>
          <div className="h-[400px] pr-4 overflow-auto">  
            <div className="space-y-4">
              {template.supportedMetrics.map((metricKey) => (
                <div key={metricKey} className="flex items-center space-x-2">
                  <Checkbox 
                    id={metricKey} 
                    checked={selectedMetrics.includes(metricKey)}
                    onCheckedChange={() => handleToggleMetric(metricKey)}
                  />
                  <Label htmlFor={metricKey} className="text-sm font-normal cursor-pointer">
                    {METRIC_LABELS[metricKey] || metricKey}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// --- Sortable Block Item ---
function SortableBlock({ 
  block, 
  onDelete,
  onEdit
}: { 
  block: ReportBlockInterface; 
  onDelete: () => void;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block._id! });
  const template = BLOCK_TEMPLATES.find(t => t.id === block.templateId);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-card border rounded-lg p-4 mb-4 flex items-center gap-4 shadow-sm">
      <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical size={20} />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold">{template?.title || block.templateId}</h4>
        <p className="text-sm text-muted-foreground">{template?.category} • {block.config?.metricsSelected?.length || 0} métricas</p>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Settings size={16} />
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={onDelete}>
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
}

// --- Main Editor ---
export default function ReportEditor({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: report } = useSWR<any>(`/api/marketing/reports/${id}`, fetcher);
  const { data: blocksRes, mutate } = useSWR<{ data: ReportBlockInterface[] }>(`/api/marketing/reports/${id}/blocks`, fetcher);

  const [editingBlock, setEditingBlock] = useState<ReportBlockInterface | null>(null);

  const blocks = blocksRes?.data || [];

  const handleAddBlock = async (templateId: string) => {
    try {
      await fetcher(`/api/marketing/reports/${id}/blocks`, {
        method: "POST",
        body: { templateId },
      });
      mutate();
      toast.success("Bloco adicionado");
    } catch {
      toast.error("Erro ao adicionar bloco");
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      await fetcher(`/api/marketing/reports/${id}/blocks/${blockId}`, { method: "DELETE" });
      mutate();
      toast.success("Bloco removido");
    } catch {
      toast.error("Erro ao remover bloco");
    }
  };

  const handleUpdateBlockConfig = async (blockId: string, config: any) => {
    try {
      await fetcher(`/api/marketing/reports/${id}/blocks/${blockId}`, {
        method: "PATCH",
        body: { config },
      });
      mutate();
      toast.success("Configuração atualizada");
    } catch {
      toast.error("Erro ao atualizar configuração");
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b._id === active.id);
      const newIndex = blocks.findIndex((b) => b._id === over.id);
      
      const newOrder = arrayMove(blocks, oldIndex, newIndex);
      
      // Optimistic update (optional, skipping for brevity)
      
      // Send reorder request
      try {
        await fetcher(`/api/marketing/reports/${id}/blocks/reorder`, { // Using the PATCH endpoint logic we added
            method: "PATCH",
            body: { 
                reorder: true,
                blocks: newOrder.map((b, idx) => ({ _id: b._id, order: idx })) 
            }
        });
        mutate();
      } catch (e) {
        toast.error("Erro ao reordenar");
      }
    }
  };

  if (!report) return <div>Carregando...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar: Library */}
      <div className="w-80 border-r p-4 overflow-y-auto">
        <h3 className="font-bold mb-4">Biblioteca de Blocos</h3>
        <div className="space-y-4">
          {BLOCK_TEMPLATES.map((template) => (
            <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleAddBlock(template.id)}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium">{template.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                {template.objective}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-8 overflow-y-auto bg-muted/10">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold">{report.name}</h1>
                <p className="text-muted-foreground text-sm">Arraste os blocos para organizar o relatório.</p>
            </div>
            <Button variant="outline" asChild>
                <a href={`/r/${report.slug}`} target="_blank">Visualizar Público</a>
            </Button>
          </div>

          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map(b => b._id!)} strategy={verticalListSortingStrategy}>
              {blocks.map((block) => (
                <SortableBlock 
                  key={block._id} 
                  block={block} 
                  onDelete={() => handleDeleteBlock(block._id!)} 
                  onEdit={() => setEditingBlock(block)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {blocks.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground">O relatório está vazio. Adicione blocos da biblioteca.</p>
            </div>
          )}
        </div>
      </div>

      <BlockConfigSheet 
        block={editingBlock} 
        isOpen={!!editingBlock} 
        onClose={() => setEditingBlock(null)} 
        onSave={handleUpdateBlockConfig} 
      />
    </div>
  );
}
