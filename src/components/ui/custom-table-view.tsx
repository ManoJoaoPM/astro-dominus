import React, { useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import useSWR from "swr";
import { fetcher } from "@discovery-solutions/struct";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
} from "lucide-react";
import { useModalForm, useConfirmDialog, ConfirmDialog } from "@discovery-solutions/struct/client";
import { FilterBar } from "@/components/ui/filter-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface FilterOption {
  key: string;
  label: string;
  type: "select" | "text" | "boolean";
  options?: { label: string; value: string }[];
}

interface CustomTableViewProps {
  columns: ColumnDef<any>[];
  endpoint: string;
  modalId?: string;
  queryParams?: Record<string, any>;
  pageSize?: number;
  hideAdd?: boolean;
  hideOptions?: boolean;
  filterOptions?: FilterOption[];
  enableSearch?: boolean; // Novo: Habilita barra de busca
}

export function CustomTableView({
  columns,
  endpoint,
  modalId,
  queryParams = {},
  pageSize = 20,
  hideAdd = false,
  hideOptions = false, // Novo: Habilita/Desabilita ações (edit, delete, dup)
  filterOptions,
  enableSearch = false, // Novo
}: CustomTableViewProps) {
  const [page, setPage] = useState(1);
  const [internalFilters, setInternalFilters] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const { openModal } = useModalForm();

  // Debounce do search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      if (searchTerm !== debouncedSearch) setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  // Constroi a URL com query params
  const buildUrl = () => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", pageSize.toString());

    if (enableSearch && debouncedSearch) {
      // COMENTADO: Não enviar search para o backend para permitir filtro no frontend
      // params.set("search", debouncedSearch);
    }

    // Merge external queryParams and internalFilters
    const allFilters = { ...queryParams, ...internalFilters };

    Object.entries(allFilters).forEach(([key, value]) => {
      // Modificação aqui: verifica se value não é nulo/undefined, mas permite "" se necessário (embora backend possa ignorar)
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, value.toString());
      }
    });
    
    // Adiciona timestamp para evitar cache do browser em requests GET
    // params.set("_t", Date.now().toString());

    return `/api/${endpoint}?${params.toString()}`;
  };

  const { data, isLoading, mutate } = useSWR<{
    data: any[];
    totalPages: number;
    total: number;
  }>(buildUrl(), fetcher);

  // Ações de Registro (Edit, Duplicate, Delete)
  const handleEdit = (row: any) => {
    // Para edição, precisamos passar o ID e defaultValues
    if (modalId) {
      openModal({ 
        modalId, 
        id: row._id, 
        defaultValues: row,
      });
    }
  };

  const handleDuplicate = async (row: any) => {
    if (!modalId) return;
    const { _id, ...rest } = row;
    // Para duplicar, passamos defaultValues (sem ID) e NÃO passamos 'id'
    openModal({ 
      modalId, 
      defaultValues: { ...rest, name: `${rest.name} (Cópia)` },
    });
  };

  const { open, setOpen, trigger } = useConfirmDialog();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteId(id);
    trigger();
  };

  const onConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await fetcher(`/api/${endpoint}/${deleteId}`, { method: "DELETE" });
      toast.success("Registro excluído com sucesso!");
      
      await mutate();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir registro.");
    } finally {
      setDeleteId(null);
      setOpen(false);
    }
  };

  // Importar ConfirmDialog do struct
  // Adicionar import { ConfirmDialog } from "@discovery-solutions/struct/client"; no topo

  // Colunas + Coluna de Ações
  const tableColumns = React.useMemo(() => {
    if (hideOptions) return columns;

    return [
      ...columns,
      {
        id: "actions",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(item)}>
                    {/* <Edit className="mr-2 h-4 w-4" /> */}
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicate(item)}>
                    {/* <Copy className="mr-2 h-4 w-4" /> */}
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(item._id)}
                  >
                    {/* <Trash2 className="mr-2 h-4 w-4" /> */}
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
  }, [columns, hideOptions, modalId]); // Recalcula se as deps mudarem

  // Filtro no Frontend (se o backend ignorar o parâmetro search)
  const filteredData = React.useMemo(() => {
    // Garante que temos um array
    const result = Array.isArray(data) ? data : data?.data || [];
    
    // Se a busca estiver habilitada e houver termo
    if (enableSearch && debouncedSearch) {
       if (!result) return [];
       const lowerTerm = debouncedSearch.toLowerCase();
       
       return result.filter((item: any) => {
         // Filtra se algum valor das propriedades do objeto contiver o termo
         // Filtra apenas strings e números para evitar objetos complexos
         return Object.values(item).some((val) => {
            if (typeof val === 'string' || typeof val === 'number') {
                return String(val).toLowerCase().includes(lowerTerm);
            }
            return false;
         });
       });
    }
    
    return result;
  }, [data, enableSearch, debouncedSearch]);

  const tableData = filteredData;
  // const totalPages = ... (precisaria recalcular se fosse client-side pagination real, mas aqui é hibrido/gambiarra)
  const totalItems = data?.total || tableData.length;

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, 
  });

  return (
    <div className="space-y-4 p-4">
      {/* Header com filtros, busca e ações */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
          <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
            {enableSearch && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            )}
            
            {filterOptions && (
              <FilterBar
                options={filterOptions}
                onFilterChange={(newFilters) => {
                  setInternalFilters(newFilters);
                  setPage(1);
                }}
              />
            )}
          </div>

          {!hideAdd && modalId && (
            <Button onClick={() => openModal({ modalId })} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  Carregando...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {totalItems > 0
            ? `Mostrando ${(page - 1) * pageSize + 1} a ${Math.min(
                page * pageSize,
                totalItems
              )} de ${totalItems} registros`
            : "0 registros"}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <div className="text-sm font-medium">
            Página {page} de {data?.totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!data || page >= data?.totalPages || isLoading}
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Dialog de Confirmação */}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Excluir registro"
        description="Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita."
        onPress={onConfirmDelete}
      />
    </div>
  );
}
