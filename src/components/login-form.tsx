"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { signInSchema } from "@/services/auth/utils";
import { SocialButtons } from "./social-buttons";
import { ENV } from "@/env";

export function LoginForm({
  className,
  providers,
  action,
}: React.ComponentProps<"form"> & {
  providers: { id: string; name: string }[];
}) {
  const searchParams = useSearchParams();
  const callbackUrl = decodeURIComponent(searchParams.get("callbackUrl") || "");

  const [mode, setMode] = useState<"social" | "password">("social");
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("refresh") === "force")
      router.refresh();
  }, [router, searchParams]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signInSchema),
  });

  const mutation = useMutation({
    mutationKey: ["auth", "signin"],
    mutationFn: async (data: any) => {
      const res = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl,
      });

      if (!res) throw new Error("Nenhuma resposta do servidor.");
      if (res.error === "CredentialsSignin") throw new Error("Email ou senha inválidos.");
      if (res.error) throw new Error(res.error);
      if (!res.url) throw new Error("Falha ao autenticar.");
      return res.url;
    },
    onSuccess: (url) => {
      toast.success("Login realizado com sucesso!");
      window.location.href = url;
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erro ao fazer login.";
      toast.error(message);
    },
  });

  return (
    <form
      action={action}
      className={cn("flex flex-col gap-6 p-6 md:p-8 overflow-hidden", className)}
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">{ENV.NEXT_PUBLIC_APP_NAME}</h1>
        <p className="text-muted-foreground text-balance">
          Faça login na sua conta
        </p>
      </div>

      <div className={cn("relative transition-all", mode === "social" ? "min-h-[8rem]" : "min-h-[15.5rem]")}>
        <AnimatePresence mode="sync" initial={false}>
          {mode === "social" ? (
            <motion.div
              key="social"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 flex flex-col gap-4"
            >
              <SocialButtons providers={providers} callbackUrl={callbackUrl} />

              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  ou
                </span>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setMode("password")}
              >
                Entrar com email e senha
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="password"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 flex flex-col gap-4"
            >
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
              </div>

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Esqueceu sua senha?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="******"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  {mutation.isPending ? "Aguarde..." : "Entrar"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm text-muted-foreground"
                  onClick={() => setMode("social")}
                >
                  Voltar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
