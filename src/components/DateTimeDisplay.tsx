'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CardSizeControl from '@/components/CardSizeControl';
import { useCardSize } from '@/hooks/useCardSize';

export default function DateTimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(true);
  const { size, setSize, isFullscreen, isExpanded } = useCardSize('standard');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    };
    return date.toLocaleDateString('zh-CN', options);
  };

  const formatTime = (date: Date) => {
    if (is24Hour) {
      return date.toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } else {
      return date.toLocaleTimeString('zh-CN', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }
  };

  const toggleTimeFormat = () => {
    setIs24Hour(!is24Hour);
  };

  // 根据尺寸动态计算样式
  const getCardClassName = () => {
    if (isFullscreen) {
      return 'fixed inset-0 z-50 rounded-none m-0 bg-background flex flex-col items-center justify-center';
    }
    return 'w-full';
  };

  const getTimeClassName = () => {
    if (isFullscreen) {
      return 'text-8xl font-bold tracking-wider text-foreground font-mono';
    }
    if (isExpanded) {
      return 'text-7xl font-bold tracking-wider text-foreground font-mono';
    }
    return 'text-5xl font-bold tracking-wider text-foreground font-mono';
  };

  const getDateClassName = () => {
    if (isFullscreen) {
      return 'text-4xl font-semibold text-primary';
    }
    if (isExpanded) {
      return 'text-3xl font-semibold text-primary';
    }
    return 'text-2xl font-semibold text-primary';
  };

  return (
    <Card className={getCardClassName()}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-shrink-0">
        <CardTitle>📅 当前日期时间</CardTitle>
        <div className="flex items-center gap-2">
          <Button onClick={toggleTimeFormat} variant="outline" size="sm">
            {is24Hour ? '切换至12小时制' : '切换至24小时制'}
          </Button>
          <CardSizeControl size={size} onSizeChange={setSize} />
        </div>
      </CardHeader>
      <CardContent className={isFullscreen ? 'flex-1 flex items-center justify-center' : ''}>
        <div className="text-center space-y-4">
          <div className={getDateClassName()} suppressHydrationWarning>
            {formatDate(currentTime)}
          </div>
          <div className={getTimeClassName()} suppressHydrationWarning>
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-muted-foreground">
            当前格式：{is24Hour ? '24小时制' : '12小时制'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
