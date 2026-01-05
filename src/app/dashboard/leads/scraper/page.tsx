"use client";

import { useState } from "react";
import useSWR from "swr";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, MapPin } from "lucide-react";
import { toast } from "sonner";
import { fetcher } from "@discovery-solutions/struct";

interface CitySummary {
  _id: string; // City name
  count: number;
}

export default function ScraperPage() {
  const [cityInput, setCityInput] = useState("");
  const [isScraping, setIsScraping] = useState(false);

  const { data, mutate } = useSWR<{ cities: CitySummary[] }>(
    "/api/commercial/scraper",
    fetcher
  );

  const handleScrape = async () => {
    if (!cityInput.trim()) return;
    
    setIsScraping(true);
    toast.info(`Iniciando busca em ${cityInput}...`);

    try {
      await fetcher("/api/commercial/scraper", {
        method: "POST",
        body: { city: cityInput },
      });
      
      toast.success("Busca iniciada! Os leads aparecerão em breve.");
      setCityInput("");
      // Refresh list after a delay to show new city if it wasn't there
      setTimeout(() => mutate(), 3000); 
    } catch (error) {
      toast.error("Erro ao iniciar busca.");
      console.error(error);
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="w-full">
      <SiteHeader
        heading={[
          { link: "/dashboard/leads", label: "Leads" },
          { link: "/dashboard/leads/scraper", label: "Scraper" },
        ]}
      />

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        
        {/* Search Section */}
        <div className="flex flex-col md:flex-row gap-4 items-end bg-card border rounded-xl p-6 shadow-sm">
           <div className="flex-1 space-y-2 w-full">
             <label className="text-sm font-medium">Buscar nova cidade</label>
             <div className="relative">
               <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
               <Input 
                 placeholder="Digite o nome da cidade (ex: São Paulo)" 
                 value={cityInput}
                 onChange={(e) => setCityInput(e.target.value)}
                 className="pl-9"
                 onKeyDown={(e) => e.key === "Enter" && handleScrape()}
               />
             </div>
           </div>
           <Button 
             onClick={handleScrape} 
             disabled={isScraping || !cityInput.trim()}
             className="w-full md:w-auto"
           >
             {isScraping ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Buscando...
               </>
             ) : (
               <>
                 <Search className="mr-2 h-4 w-4" />
                 Iniciar Scraping
               </>
             )}
           </Button>
        </div>

        {/* Cities Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Cidades Mapeadas</h2>
          
          {!data ? (
             <div className="text-center py-10 text-muted-foreground">Carregando cidades...</div>
          ) : data.cities.length === 0 ? (
             <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                Nenhuma cidade mapeada ainda. Inicie uma busca acima.
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.cities.map((city) => (
                <Card key={city._id} className="hover:shadow-md transition-shadow cursor-default">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {city._id}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{city.count}</div>
                    <p className="text-xs text-muted-foreground">leads encontrados</p>
                    <div className="mt-4 pt-4 border-t">
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="w-full text-xs h-8"
                         onClick={() => {
                            setCityInput(city._id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                         }}
                       >
                         Atualizar dados
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
