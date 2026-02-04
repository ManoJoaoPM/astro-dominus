"use client";

import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Search, Facebook } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface ConnectMetaModalProps {
  clientId: string;
  onSuccess?: () => void;
}

interface MetaAccountOption {
  id: string;
  name: string;
  currency: string;
  timezone_name: string;
}

export function ConnectMetaModal({ clientId, onSuccess }: ConnectMetaModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { mutate } = useSWRConfig();
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Form State
  const [step, setStep] = useState<1 | 2>(1);
  const [accessToken, setAccessToken] = useState("");
  const [accounts, setAccounts] = useState<MetaAccountOption[]>([]);
  
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [name, setName] = useState("Meta Ads Principal");

  // Check for token in URL (OAuth callback)
  useEffect(() => {
    const action = searchParams.get("action");
    const status = searchParams.get("status");
    
    // If returning from success OAuth
    if (action === "connect_meta" && status === "success") {
      setOpen(true);
      // Clean URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      params.delete("status");
      router.replace(`${pathname}?${params.toString()}`);
      
      // Auto trigger fetch (without token, so backend uses stored one)
      setTimeout(() => handleFetchAccounts(), 500);
    }
  }, [searchParams]);

  // Initial check for stored token when opening manually
  useEffect(() => {
    if (open && step === 1 && !accessToken) {
       // Try to fetch accounts without token to see if user has one stored
       handleFetchAccounts();
    }
  }, [open]);

  const handleLogin = () => {
    // Redirect to backend login route
    window.location.href = `/api/auth/meta/login?clientId=${clientId}`;
  };

  const handleFetchAccounts = async (tokenOverride?: string) => {
    const tokenToUse = tokenOverride || accessToken;
    // Remove check: if (!tokenToUse) ... because we might use stored token

    try {
      setLoading(true);
      const res = await fetch("/api/marketing/meta/ad-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: tokenToUse }),
      });

      const data = await res.json();
      if (!res.ok) {
         // Only show error if we provided a token OR if the error is not "token required"
         // If we tried auto-fetch (no token) and failed, we just stay on Step 1 silently
         if (tokenToUse) {
             throw new Error(data.error || "Falha ao buscar contas");
         } else {
             // Silent fail, user needs to login
             return;
         }
      }

      setAccounts(data.accounts);
      if (data.accounts.length === 0) {
        toast.warning("Nenhuma conta de anúncios encontrada para este usuário.");
      } else {
        setStep(2);
        if (data.accounts.length > 0) {
          setSelectedAccountId(data.accounts[0].id);
          setName(data.accounts[0].name || "Meta Ads");
        }
        if (data.usingStoredToken) {
            toast.success("Contas carregadas via login anterior.");
        }
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedAccountId) { // Token might be empty if using stored
      toast.error("Selecione uma conta.");
      return;
    }

    try {
      setLoading(true);

      // 1. Create Integration
      const res = await fetch("/api/marketing/integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          provider: "meta",
          name,
          adAccountId: selectedAccountId,
          accessToken, // Might be empty, backend should handle? 
                       // WAIT: Integration model needs accessToken.
                       // If we are using stored token, we need to pass it OR
                       // tell backend to use stored user token.
        }),
      });

      if (!res.ok) throw new Error("Falha ao criar integração");
      const integration = await res.json();

      toast.success("Integração criada! Iniciando sincronização...");

      // 2. Trigger Initial Sync
      const syncRes = await fetch("/api/marketing/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId: integration._id }),
      });

      if (!syncRes.ok) throw new Error("Falha na sincronização inicial");

      toast.success("Sincronização concluída com sucesso!");
      
      setOpen(false);
      // Reset state for next open
      setStep(1);
      setAccounts([]);
      setAccessToken("");
      
      mutate((key: string) => key.includes("/api/marketing/integration")); // Refresh list
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error(error);
      toast.error("Erro ao conectar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Conectar Conta Meta Ads</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Conectar Meta Ads</DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Faça login com o Facebook para listar suas contas de anúncio disponíveis."
              : "Selecione qual conta de anúncios deseja vincular a este cliente."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <Button onClick={handleLogin} className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90">
                <Facebook className="mr-2 h-4 w-4" />
                Continuar com Facebook
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou insira o token manualmente
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="token">Access Token (Manual)</Label>
                <div className="flex gap-2">
                <Input
                  id="token"
                  type="password"
                  placeholder="EAAG..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
              </div>
                <p className="text-[10px] text-muted-foreground">
                  Se preferir, cole um token gerado manualmente.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Conta de Anúncios</Label>
                <Select 
                  value={selectedAccountId} 
                  onValueChange={(val) => {
                    setSelectedAccountId(val);
                    const acc = accounts.find(a => a.id === val);
                    if (acc) setName(acc.name);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} ({acc.id}) - {acc.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Integração</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 1 ? (
            <Button onClick={() => handleFetchAccounts()} disabled={loading} variant="secondary" size="sm">
              <Search className="mr-2 h-4 w-4" />
              Buscar com Token Manual
            </Button>
          ) : (
            <div className="flex w-full justify-between">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={loading}>
                Voltar
              </Button>
              <Button onClick={handleConnect} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Conectar e Sincronizar
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
