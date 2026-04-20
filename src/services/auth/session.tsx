"use client";
import { createContext, Suspense, useContext, useEffect } from "react";
import { redirect, usePathname } from "next/navigation";
import { CustomSession } from "@/services/auth/utils";
import { publicRoutes } from "@/services/auth/public-routes";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@discovery-solutions/struct/client";

export const Context = createContext<{ user: CustomSession["user"], isLoading: boolean }>({
  user: {} as CustomSession["user"],
  isLoading: true,
});

function InnerSessionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: user, isLoading, failureCount } = useQuery({
    queryKey: ["me"],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    queryFn: async () => await fetcher("/api/auth/me"),
    enabled: !publicRoutes.some(route => pathname.startsWith(route)) && pathname !== "/",
  });

  useEffect(() => {
    if (failureCount > 3 && !pathname.includes("/auth")) redirect("/auth");
  }, [failureCount, pathname]);

  if (isLoading)
    return <div className="w-full h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <Context.Provider value={{ user, isLoading }}>
      {children}
    </Context.Provider>
  );
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center">Carregando...</div>}>
      <InnerSessionProvider>{children}</InnerSessionProvider>
    </Suspense>
  );
}

export function useAuth() {
  return useContext(Context);
}
