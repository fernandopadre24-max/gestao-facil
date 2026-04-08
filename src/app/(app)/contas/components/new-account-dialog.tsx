'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useFinancialData } from '@/context/financial-context';
import type { Account } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome da conta deve ter pelo menos 2 caracteres.',
  }),
  balance: z.coerce.number(),
});

export type NewAccountFormValues = z.infer<typeof formSchema>;

interface AccountDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  accountToEdit?: Account | null;
}

export function AccountDialog({ isOpen, onOpenChange, accountToEdit }: AccountDialogProps) {
  const { toast } = useToast();
  const { createAccount, updateAccount } = useFinancialData();
  const isEditMode = !!accountToEdit;

  const form = useForm<NewAccountFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      balance: 0,
    },
  });
  
  React.useEffect(() => {
    if (isOpen) {
      if (isEditMode && accountToEdit) {
        form.reset({
          name: accountToEdit.name || '',
          balance: accountToEdit.balance || 0,
        });
      } else {
        form.reset({
          name: '',
          balance: 0,
        });
      }
    }
  }, [isOpen, isEditMode, accountToEdit, form]);


  function onSubmit(values: NewAccountFormValues) {
    if (isEditMode && accountToEdit) {
        updateAccount(accountToEdit.id, values);
        toast({
            title: 'Conta Atualizada!',
            description: `A conta "${values.name}" foi atualizada com sucesso.`,
        });
    } else {
        createAccount(values);
        toast({
          title: 'Conta Criada!',
          description: `A conta "${values.name}" foi adicionada com sucesso.`,
          className: 'bg-primary text-primary-foreground',
        });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Altere as informações da conta abaixo.' : 'Crie uma nova conta para gerenciar suas finanças.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Conta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Carteira, Poupança..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo {isEditMode ? '' : 'Inicial'} (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} disabled={isEditMode} />
                  </FormControl>
                  <FormMessage>
                    {isEditMode ? "O saldo não pode ser editado diretamente. Realize transações para alterá-lo." : "O saldo inicial não pode ser negativo."}
                  </FormMessage>
                </FormItem>
              )}
            />
            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{isEditMode ? 'Salvar Alterações' : 'Criar Conta'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
