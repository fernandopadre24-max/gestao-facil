import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function validateCPF(cpf: string): boolean {
  if (!cpf) return false;
  const cpfClean = cpf.replace(/\D/g, '');

  if (cpfClean.length !== 11 || /^(\d)\1+$/.test(cpfClean)) {
    return false;
  }

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cpfClean.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }

  if (remainder !== parseInt(cpfClean.substring(9, 10))) {
    return false;
  }

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cpfClean.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }

  if (remainder !== parseInt(cpfClean.substring(10, 11))) {
    return false;
  }

  return true;
}


export function formatCPF(cpf: string): string {
  if (!cpf) return '';
  cpf = cpf.replace(/\D/g, ''); // Remove all non-digit characters
  cpf = cpf.substring(0, 11); // Limit to 11 digits
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return cpf;
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  phone = phone.replace(/\D/g, ''); // Remove all non-digit characters
  phone = phone.substring(0, 11); // Limit to 11 digits
  if (phone.length > 10) {
    // (xx) xxxxx-xxxx
    phone = phone.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
  } else if (phone.length > 5) {
    // (xx) xxxx-xxxx
    phone = phone.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  } else if (phone.length > 2) {
    // (xx) xxxx
    phone = phone.replace(/^(\d\d)(\d{0,5}).*/, '($1) $2');
  } else {
    phone = phone.replace(/^(\d*)/, '($1');
  }
  return phone;
}
