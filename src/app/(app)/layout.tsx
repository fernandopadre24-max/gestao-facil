'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppNav } from '@/components/app-nav';
import { Landmark, CircleUser, Calculator, Calendar, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { FinancialProvider } from '@/context/financial-context';
import { CalculatorPopover } from '@/components/calculator-popover';
import Link from 'next/link';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AuthGuard } from '@/components/auth-guard';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();


  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <AuthGuard>
      <FinancialProvider>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2 p-2">
                <Landmark className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Gestor Financeiro</h1>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <AppNav />
            </SidebarContent>
            <SidebarFooter>
              {/* Footer content */}
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:h-[60px] lg:px-6">
              <SidebarTrigger className="md:hidden" />
              <div className="w-full flex-1">
                {/* Can add a search bar here if needed */}
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <CalculatorPopover />
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/calendario">
                    <Calendar className="h-5 w-5" />
                    <span className="sr-only">Calendário</span>
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                      <CircleUser className="h-5 w-5" />
                      <span className="sr-only">Toggle user menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                    <div className="px-2 pb-2">
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {user?.email || 'Usuário Anônimo'}
                        </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/configuracoes">Configurações</Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem>Suporte</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </FinancialProvider>
    </AuthGuard>
  );
}

