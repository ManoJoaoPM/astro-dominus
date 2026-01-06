import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, X } from "lucide-react";

interface FilterOption {
  key: string;
  label: string;
  type: "select" | "text" | "boolean";
  options?: { label: string; value: string }[];
}

interface FilterBarProps {
  options: FilterOption[];
  onFilterChange: (filters: Record<string, any>) => void;
  className?: string;
}

export function FilterBar({ options, onFilterChange, className }: FilterBarProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [isOpen, setIsOpen] = useState(false);

  const handleApplyFilter = (key: string, value: any) => {
    const newFilters = { ...activeFilters };
    if (value === undefined || value === "" || value === "all") {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    onFilterChange({});
    setIsOpen(false);
  };

  const activeCount = Object.keys(activeFilters).length;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {activeCount > 0 && (
              <span className="ml-2 rounded-full bg-primary w-5 h-5 text-[10px] flex items-center justify-center text-primary-foreground">
                {activeCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <h4 className="font-medium leading-none">Filtros avançados</h4>
            
            {options.map((opt) => (
              <div key={opt.key} className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {opt.label}
                </label>
                {opt.type === "select" && (
                  <Select
                    value={activeFilters[opt.key] || "all"}
                    onValueChange={(val) => handleApplyFilter(opt.key, val)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {opt.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {opt.type === "text" && (
                  <Input
                    placeholder={`Filtrar por ${opt.label.toLowerCase()}...`}
                    value={activeFilters[opt.key] || ""}
                    onChange={(e) => handleApplyFilter(opt.key, e.target.value)}
                    className="h-8"
                  />
                )}
                {opt.type === "boolean" && (
                  <Select
                    value={activeFilters[opt.key]?.toString() || "all"}
                    onValueChange={(val) => {
                      if (val === "all") handleApplyFilter(opt.key, undefined);
                      else handleApplyFilter(opt.key, val === "true");
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}

            <div className="flex justify-end pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs h-8"
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Badges de filtros ativos */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(activeFilters).map(([key, value]) => {
          const opt = options.find((o) => o.key === key);
          if (!opt) return null;
          
          let labelValue = value;
          if (opt.type === "select") {
            labelValue = opt.options?.find((o) => o.value === value)?.label || value;
          }
          if (opt.type === "boolean") {
            labelValue = value ? "Sim" : "Não";
          }

          return (
            <div
              key={key}
              className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              {opt.label}: {labelValue}
              <Button
                variant="ghost"
                size="icon"
                className="h-3 w-3 ml-1 p-0 hover:bg-transparent"
                onClick={() => handleApplyFilter(key, undefined)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
