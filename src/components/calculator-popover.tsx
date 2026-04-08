'use client';

import * as React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import { Input } from './ui/input';

export function CalculatorPopover() {
  const [display, setDisplay] = React.useState('0');
  const [firstOperand, setFirstOperand] = React.useState<number | null>(null);
  const [operator, setOperator] = React.useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] =
    React.useState(false);

  const handleDigitClick = (digit: string) => {
    if (waitingForSecondOperand) {
      setDisplay(digit);
      setWaitingForSecondOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const handleOperatorClick = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (operator && !waitingForSecondOperand) {
      if (firstOperand !== null) {
        const result = calculate(firstOperand, inputValue, operator);
        setDisplay(String(result));
        setFirstOperand(result);
      }
    } else {
      setFirstOperand(inputValue);
    }

    setWaitingForSecondOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (
    first: number,
    second: number,
    op: string
  ): number => {
    switch (op) {
      case '+':
        return first + second;
      case '-':
        return first - second;
      case '*':
        return first * second;
      case '/':
        return first / second;
      default:
        return second;
    }
  };

  const handleEqualsClick = () => {
    const inputValue = parseFloat(display);
    if (operator && firstOperand !== null) {
      const result = calculate(firstOperand, inputValue, operator);
      setDisplay(String(result));
      setFirstOperand(null);
      setOperator(null);
      setWaitingForSecondOperand(false);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };
  
  const handleDecimalClick = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const renderButton = (label: string, onClick: () => void, className?: string) => (
    <Button variant="outline" className={`h-12 text-lg ${className}`} onClick={onClick}>
      {label}
    </Button>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Calculator className="h-5 w-5" />
          <span className="sr-only">Calculadora</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 border-border bg-card text-card-foreground">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Calculadora</h4>
            <p className="text-sm text-muted-foreground">
              Faça cálculos rápidos.
            </p>
          </div>
          <Input
            type="text"
            className="h-14 text-right text-3xl font-mono bg-background"
            value={display}
            readOnly
          />
          <div className="grid grid-cols-4 gap-2">
            {renderButton('AC', handleClear, 'col-span-2 bg-destructive/20 text-destructive-foreground hover:bg-destructive/30')}
            {renderButton('÷', () => handleOperatorClick('/'), 'bg-primary/20 text-primary-foreground hover:bg-primary/30')}
            {renderButton('×', () => handleOperatorClick('*'), 'bg-primary/20 text-primary-foreground hover:bg-primary/30')}
            
            {renderButton('7', () => handleDigitClick('7'))}
            {renderButton('8', () => handleDigitClick('8'))}
            {renderButton('9', () => handleDigitClick('9'))}
            {renderButton('-', () => handleOperatorClick('-'), 'bg-primary/20 text-primary-foreground hover:bg-primary/30')}

            {renderButton('4', () => handleDigitClick('4'))}
            {renderButton('5', () => handleDigitClick('5'))}
            {renderButton('6', () => handleDigitClick('6'))}
            {renderButton('+', () => handleOperatorClick('+'), 'bg-primary/20 text-primary-foreground hover:bg-primary/30')}

            {renderButton('1', () => handleDigitClick('1'))}
            {renderButton('2', () => handleDigitClick('2'))}
            {renderButton('3', () => handleDigitClick('3'))}
            {renderButton('=', handleEqualsClick, 'row-span-2 h-auto bg-primary text-primary-foreground hover:bg-primary/90')}

            {renderButton('0', () => handleDigitClick('0'), 'col-span-2')}
            {renderButton('.', handleDecimalClick)}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
