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
import type { Client } from '@/lib/types';
import { formatCPF, formatPhone, validateCPF } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(3, {
    message: 'O nome do cliente deve ter pelo menos 3 caracteres.',
  }),
  cpf: z.string().refine(validateCPF, {
    message: 'O CPF informado é inválido.',
  }),
  email: z.string().email({
    message: 'Por favor, insira um endereço de e-mail válido.',
  }),
  phone: z.string().min(10, {
    message: 'O telefone é inválido.',
  }),
  address: z.string().min(5, {
    message: 'O endereço deve ter pelo menos 5 caracteres.',
  }),
});

export type NewClientFormValues = z.infer<typeof formSchema>;

interface ClientDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  clientToEdit?: Client | null;
}

export function ClientDialog({ isOpen, onOpenChange, clientToEdit }: ClientDialogProps) {
  const { toast } = useToast();
  const { createClient, updateClient } = useFinancialData();
  const isEditMode = !!clientToEdit;

  const form = useForm<NewClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      cpf: '',
      email: '',
      phone: '',
      address: '',
    },
  });
  
  React.useEffect(() => {
    if (isOpen) {
      if (isEditMode && clientToEdit) {
        form.reset({
          name: clientToEdit.name || '',
          cpf: clientToEdit.cpf || '',
          email: clientToEdit.email || '',
          phone: clientToEdit.phone || '',
          address: clientToEdit.address || '',
        });
      } else {
        form.reset({
          name: '',
          cpf: '',
          email: '',
          phone: '',
          address: '',
        });
      }
    }
  }, [isOpen, isEditMode, clientToEdit, form]);


  function onSubmit(values: NewClientFormValues) {
    const formattedValues = {
        ...values,
        cpf: values.cpf.replace(/\D/g, ''),
        phone: values.phone.replace(/\D/g, ''),
    }
    if (isEditMode && clientToEdit) {
      updateClient(clientToEdit.id, formattedValues);
      toast({
        title: 'Cliente Atualizado!',
        description: `O cliente "${values.name}" foi atualizado com sucesso.`,
      });
    } else {
      createClient(formattedValues);
      toast({
        title: 'Cliente Criado!',
        description: `O cliente "${values.name}" foi adicionado com sucesso.`,
        className: 'bg-primary text-primary-foreground',
      });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Altere as informações do cliente abaixo.' : 'Adicione um novo cliente ao seu sistema.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} onChange={(e) => field.onChange(formatCPF(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 90000-0000" {...field} onChange={(e) => field.onChange(formatPhone(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="cliente@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, Número, Bairro, Cidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{isEditMode ? 'Salvar Alterações' : 'Criar Cliente'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
