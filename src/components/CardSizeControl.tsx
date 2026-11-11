'use client';

import { Button } from '@/components/ui/button';
import { CardSize } from '@/hooks/useCardSize';
import { Minimize2, Maximize2, Expand, Minimize } from 'lucide-react';

interface CardSizeControlProps {
  size: CardSize;
  onSizeChange: (size: CardSize) => void;
}

export default function CardSizeControl({ size, onSizeChange }: CardSizeControlProps) {
  const sizes: { value: CardSize; label: string; icon: React.ReactNode }[] = [
    { value: 'standard', label: '标准', icon: <Minimize2 className="h-3 w-3" /> },
    { value: 'expanded', label: '放大', icon: <Maximize2 className="h-3 w-3" /> },
    { value: 'fullscreen', label: '全屏', icon: <Expand className="h-3 w-3" /> },
  ];

  return (
    <div className="flex items-center gap-1">
      {sizes.map((item) => (
        <Button
          key={item.value}
          variant={size === item.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSizeChange(item.value)}
          className="h-7 w-7 p-0"
          title={item.label}
        >
          {item.icon}
        </Button>
      ))}
    </div>
  );
}
