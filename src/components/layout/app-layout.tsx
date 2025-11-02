import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { useAuth } from "@/hooks/use-auth";
import { Loading } from "@/components/ui/loading";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isLoading, isAuthenticated, supabaseReachable, role } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loading message="Carregando aplicação..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const supabaseWarning = !supabaseReachable ? (
    <div className="mb-4 p-3 rounded bg-yellow-800 text-yellow-100 border border-yellow-700 text-sm">
      Conexão com o Supabase falhou. Verifique a configuração do Supabase ou conecte via MCP: clique em <strong>Open MCP popover</strong> e [Connect to Supabase](#open-mcp-popover).
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="pt-20 pb-8 px-4 min-h-screen animate-slide-in">
        {supabaseWarning}
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
