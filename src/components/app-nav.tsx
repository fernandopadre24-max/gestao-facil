'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Home, List, BarChart3, Bot, Contact, Calendar, Settings, FileText } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Painel de Controle', icon: Home },
  { href: '/emprestimos', label: 'Empréstimos', icon: List },
  { href: '/clientes', label: 'Clientes', icon: Contact },
  { href: '/contas', label: 'Contas', icon: BarChart3 },
  { href: '/calendario', label: 'Calendário', icon: Calendar },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
];

const bottomNavItems = [
    { href: '/analise-de-credito', label: 'Análise de Crédito', icon: Bot },
    { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function AppNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col justify-between h-full">
        <SidebarMenu>
        {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                <Link href={item.href}>
                <item.icon />
                {item.label}
                </Link>
            </SidebarMenuButton>
            </SidebarMenuItem>
        ))}
        </SidebarMenu>
        <SidebarMenu>
            {bottomNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                    <Link href={item.href}>
                    <item.icon />
                    {item.label}
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    </div>
  );
}
