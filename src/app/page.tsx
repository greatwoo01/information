import type { Metadata } from 'next';
import DateTimeDisplay from '@/components/DateTimeDisplay';
import WeatherWidget from '@/components/WeatherWidget';
import CountdownTimer from '@/components/CountdownTimer';

export const metadata: Metadata = {
  title: '信息综合面板 - 日期时间、天气与倒计时',
  description: '包含当前日期时间、天气预报和倒计时功能的综合信息页面',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            信息综合面板
          </h1>
          <p className="text-muted-foreground">
            日期时间 · 天气预报 · 番茄计时器
          </p>
        </div>

        {/* 主内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧列 */}
          <div className="space-y-6">
            {/* 日期时间 */}
            <DateTimeDisplay />
            
            {/* 倒计时器 */}
            <CountdownTimer />
          </div>

          {/* 右侧列 - 天气（合并卡片） */}
          <div className="lg:row-span-2">
            <WeatherWidget />
          </div>
        </div>

        {/* 页脚 */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>数据来源：Open-Meteo API · 位置信息需要浏览器授权</p>
        </div>
      </div>
    </div>
  );
}
