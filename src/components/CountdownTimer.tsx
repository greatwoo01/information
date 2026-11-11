'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import CardSizeControl from '@/components/CardSizeControl';
import { useCardSize } from '@/hooks/useCardSize';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 声音类型定义
type SoundType = 'classic' | 'electronic' | 'crisp' | 'gentle' | 'alarm';

interface SoundOption {
  value: SoundType;
  label: string;
  icon: string;
  description: string;
}

const soundOptions: SoundOption[] = [
  { value: 'classic', label: '经典铃声', icon: '🔔', description: '传统的正弦波铃声' },
  { value: 'electronic', label: '电子闹钟', icon: '⚡', description: '方波节奏感闹钟' },
  { value: 'crisp', label: '清脆滴答', icon: '✨', description: '高频清脆提示音' },
  { value: 'gentle', label: '柔和提示', icon: '🎵', description: '低频舒缓音乐' },
  { value: 'alarm', label: '紧急警报', icon: '🚨', description: '快速交替警报声' },
];

// 番茄计时状态
type TimerMode = 'focus' | 'break';

// 可选时间（5分钟一档，5-60分钟）
const timeOptions = Array.from({ length: 12 }, (_, i) => (i + 1) * 5);

export default function PomodoroTimer() {
  // 时间设置
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  // 计时状态
  const [currentMode, setCurrentMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoop, setIsLoop] = useState(false);

  // 声音
  const [selectedSound, setSelectedSound] = useState<SoundType>('classic');

  // 卡片尺寸
  const { size, setSize, isFullscreen, isExpanded } = useCardSize('standard');

  // 音频相关
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // 清理所有音频资源
  const cleanupAudio = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    oscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // 忽略已停止的错误
      }
    });
    oscillatorsRef.current = [];
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  // 停止闹钟
  const stopAlarm = () => {
    cleanupAudio();
  };

  // 经典铃声 - 简单正弦波
  const playClassicAlarm = (audioContext: AudioContext) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 800;
    oscillator.connect(gainNodeRef.current!);
    gainNodeRef.current!.gain.value = 0.5;
    oscillator.start();
    oscillatorsRef.current.push(oscillator);
  };

  // 电子闹钟 - 方波节奏
  const playElectronicAlarm = (audioContext: AudioContext) => {
    gainNodeRef.current!.gain.value = 0.4;
    let isOn = true;

    intervalIdRef.current = setInterval(() => {
      if (!audioContextRef.current) return;
      const osc = audioContextRef.current.createOscillator();
      osc.type = 'square';
      osc.frequency.value = isOn ? 1000 : 800;
      osc.connect(gainNodeRef.current!);
      osc.start();
      osc.stop(audioContextRef.current.currentTime + 0.1);
      oscillatorsRef.current.push(osc);
      isOn = !isOn;
    }, 150);
  };

  // 清脆滴答 - 高频短促
  const playCrispAlarm = (audioContext: AudioContext) => {
    gainNodeRef.current!.gain.value = 0.3;

    intervalIdRef.current = setInterval(() => {
      if (!audioContextRef.current) return;
      const osc = audioContextRef.current.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 2000;
      osc.connect(gainNodeRef.current!);
      osc.start();
      osc.stop(audioContextRef.current.currentTime + 0.05);
      oscillatorsRef.current.push(osc);
    }, 100);
  };

  // 柔和提示 - 低频舒缓
  const playGentleAlarm = (audioContext: AudioContext) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 400;
    oscillator.connect(gainNodeRef.current!);
    gainNodeRef.current!.gain.value = 0.3;

    // 缓慢上升的音调
    const now = audioContext.currentTime;
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.linearRampToValueAtTime(600, now + 0.5);
    oscillator.frequency.linearRampToValueAtTime(400, now + 1);

    oscillator.start();
    oscillatorsRef.current.push(oscillator);
  };

  // 紧急警报 - 快速交替
  const playUrgentAlarm = (audioContext: AudioContext) => {
    gainNodeRef.current!.gain.value = 0.5;
    let high = true;

    intervalIdRef.current = setInterval(() => {
      if (!audioContextRef.current) return;
      const osc = audioContextRef.current.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = high ? 1200 : 800;
      osc.connect(gainNodeRef.current!);
      osc.start();
      osc.stop(audioContextRef.current.currentTime + 0.08);
      oscillatorsRef.current.push(osc);
      high = !high;
    }, 200);
  };

  // 播放指定类型的声音
  const playAlarm = (soundType: SoundType) => {
    try {
      cleanupAudio();

      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);

      switch (soundType) {
        case 'classic':
          playClassicAlarm(audioContextRef.current);
          break;
        case 'electronic':
          playElectronicAlarm(audioContextRef.current);
          break;
        case 'crisp':
          playCrispAlarm(audioContextRef.current);
          break;
        case 'gentle':
          playGentleAlarm(audioContextRef.current);
          break;
        case 'alarm':
          playUrgentAlarm(audioContextRef.current);
          break;
      }

      // 3秒后自动停止
      setTimeout(() => {
        stopAlarm();
      }, 3000);
    } catch (error) {
      console.error('播放闹钟失败:', error);
    }
  };

  // 预览声音
  const previewSound = (soundType: SoundType) => {
    try {
      cleanupAudio();

      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);

      switch (soundType) {
        case 'classic':
          playClassicAlarm(audioContextRef.current);
          break;
        case 'electronic':
          playElectronicAlarm(audioContextRef.current);
          break;
        case 'crisp':
          playCrispAlarm(audioContextRef.current);
          break;
        case 'gentle':
          playGentleAlarm(audioContextRef.current);
          break;
        case 'alarm':
          playUrgentAlarm(audioContextRef.current);
          break;
      }

      // 1秒后自动停止预览
      setTimeout(() => {
        cleanupAudio();
      }, 1000);
    } catch (error) {
      console.error('播放预览失败:', error);
    }
  };

  // 倒计时逻辑
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playAlarm(selectedSound);
            // 循环模式下自动切换
            if (isLoop) {
              if (currentMode === 'focus') {
                setCurrentMode('break');
                return breakMinutes * 60;
              } else {
                setCurrentMode('focus');
                return focusMinutes * 60;
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft, selectedSound, isLoop, currentMode, focusMinutes, breakMinutes]);

  // 更新专注时间
  const handleFocusChange = (value: string) => {
    const newFocus = parseInt(value);
    setFocusMinutes(newFocus);
    if (currentMode === 'focus' && !isRunning && timeLeft === focusMinutes * 60) {
      setTimeLeft(newFocus * 60);
    }
  };

  // 更新休息时间
  const handleBreakChange = (value: string) => {
    const newBreak = parseInt(value);
    setBreakMinutes(newBreak);
    if (currentMode === 'break' && !isRunning && timeLeft === breakMinutes * 60) {
      setTimeLeft(newBreak * 60);
    }
  };

  // 开始/暂停
  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      if (timeLeft === 0) {
        setTimeLeft(currentMode === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
      }
      setIsRunning(true);
    }
  };

  // 重置
  const resetTimer = () => {
    setIsRunning(false);
    setCurrentMode('focus');
    setTimeLeft(focusMinutes * 60);
    stopAlarm();
  };

  // 格式化时间
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    return {
      hours: h.toString().padStart(2, '0'),
      minutes: m.toString().padStart(2, '0'),
      seconds: s.toString().padStart(2, '0'),
    };
  };

  const displayTime = formatTime(timeLeft);

  // 根据尺寸动态计算样式
  const getCardClassName = () => {
    if (isFullscreen) {
      return 'fixed inset-0 z-50 rounded-none m-0 bg-background flex flex-col items-center justify-center';
    }
    return 'w-full';
  };

  const getTimerClassName = () => {
    if (isFullscreen) {
      return 'text-8xl font-mono font-bold tracking-wider text-foreground';
    }
    if (isExpanded) {
      return 'text-7xl font-mono font-bold tracking-wider text-foreground';
    }
    return 'text-6xl font-mono font-bold tracking-wider text-foreground';
  };

  return (
    <Card className={getCardClassName()}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-shrink-0">
        <CardTitle>🍅 番茄计时器</CardTitle>
        <CardSizeControl size={size} onSizeChange={setSize} />
      </CardHeader>
      <CardContent className={isFullscreen ? 'flex-1 flex flex-col items-center justify-center' : ''}>
        {/* 当前状态 */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted mb-4">
            <span className="text-sm text-muted-foreground">当前状态：</span>
            <span className={`font-semibold ${currentMode === 'focus' ? 'text-red-500' : 'text-green-500'}`}>
              {currentMode === 'focus' ? '🎯 专注' : '☕ 休息'}
            </span>
          </div>
        </div>

        {/* 倒计时显示 */}
        <div className="text-center mb-6">
          <div suppressHydrationWarning className={getTimerClassName()}>
            {displayTime.hours}:{displayTime.minutes}:{displayTime.seconds}
          </div>
        </div>

        {/* 时间设置 */}
        <div className="space-y-4 mb-6 w-full max-w-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Label htmlFor="focus-time" className="whitespace-nowrap">
                专注时间
              </Label>
              <Select value={String(focusMinutes)} onValueChange={handleFocusChange} disabled={isRunning}>
                <SelectTrigger id="focus-time" className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((min) => (
                    <SelectItem key={min} value={String(min)}>
                      {min} 分钟
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="break-time" className="whitespace-nowrap">
                休息时间
              </Label>
              <Select value={String(breakMinutes)} onValueChange={handleBreakChange} disabled={isRunning}>
                <SelectTrigger id="break-time" className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((min) => (
                    <SelectItem key={min} value={String(min)}>
                      {min} 分钟
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 声音选择 */}
        <div className="flex items-center gap-4 mb-6 w-full max-w-md">
          <Label className="whitespace-nowrap">提示音：</Label>
          <Select value={selectedSound} onValueChange={(v) => setSelectedSound(v as SoundType)}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {soundOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => previewSound(selectedSound)}
            className="whitespace-nowrap"
          >
            🔊 试听
          </Button>
        </div>

        {/* 控制按钮 */}
        <div className="flex justify-center gap-3">
          <Button onClick={toggleTimer} className="px-8">
            {isRunning ? '暂停' : '开始'}
          </Button>

          <Button
            variant={isLoop ? 'default' : 'outline'}
            onClick={() => setIsLoop(!isLoop)}
            className="px-6"
          >
            {isLoop ? '🔁 循环' : '□ 循环'}
          </Button>

          {(isRunning || timeLeft > 0) && (
            <Button onClick={resetTimer} variant="outline" className="px-8">
              重置
            </Button>
          )}
        </div>

        {/* 使用提示 */}
        <div className="mt-6 text-sm text-muted-foreground text-center">
          <p>💡 提示：专注 {focusMinutes} 分钟 + 休息 {breakMinutes} 分钟</p>
        </div>
      </CardContent>
    </Card>
  );
}
