'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const themes = [
  { name: 'default', label: 'Padrão', color: 'hsl(222.2, 47.4%, 11.2%)' },
  { name: 'green', label: 'Verde', color: 'hsl(142.1, 76.2%, 36.3%)' },
  { name: 'orange', label: 'Laranja', color: 'hsl(24.6, 95%, 53.1%)' },
  { name: 'blue', label: 'Azul', color: 'hsl(217.2, 91.2%, 59.8%)' },
  { name: 'purple', label: 'Roxo', color: 'hsl(262.1, 83.3%, 57.8%)' },
];

export function ThemeCustomizer() {
  const { theme, setTheme } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Palette className="mr-2 h-4 w-4" />
          Personalizar Tema
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            Cor do Tema
          </p>
          <div className="flex items-center space-x-2">
            {themes.map((t) => (
              <Button
                key={t.name}
                variant="outline"
                size="icon"
                className={cn(
                  'h-8 w-8 rounded-full',
                   (theme === t.name || (!theme && t.name === 'default')) && 'border-2 border-primary'
                )}
                onClick={() => setTheme(t.name)}
                style={{ backgroundColor: t.color }}
              >
                {(theme === t.name || (!theme && t.name === 'default')) && <Check className="h-4 w-4 text-white" />}
                <span className="sr-only">{t.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
