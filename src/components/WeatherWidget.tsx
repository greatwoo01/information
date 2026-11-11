'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import CardSizeControl from '@/components/CardSizeControl';
import { useCardSize } from '@/hooks/useCardSize';

interface HourlyForecastData {
  time: string;
  temperature: number;
  weathercode: number;
  precipitation: number;
}

interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    windspeed: number;
    weathercode: number;
  };
  daily: Array<{
    date: string;
    maxTemp: number;
    minTemp: number;
    weathercode: number;
  }>;
  hourly: HourlyForecastData[];
  location: string;
}

const weatherCodeMap: Record<number, { icon: string; desc: string }> = {
  0: { icon: '☀️', desc: '晴朗' },
  1: { icon: '🌤️', desc: '大部晴朗' },
  2: { icon: '⛅', desc: '局部多云' },
  3: { icon: '☁️', desc: '多云' },
  45: { icon: '🌫️', desc: '雾' },
  48: { icon: '🌫️', desc: '雾凇' },
  51: { icon: '🌧️', desc: '小毛毛雨' },
  53: { icon: '🌧️', desc: '中毛毛雨' },
  55: { icon: '🌧️', desc: '大毛毛雨' },
  61: { icon: '🌧️', desc: '小雨' },
  63: { icon: '🌧️', desc: '中雨' },
  65: { icon: '🌧️', desc: '大雨' },
  71: { icon: '🌨️', desc: '小雪' },
  73: { icon: '🌨️', desc: '中雪' },
  75: { icon: '🌨️', desc: '大雪' },
  77: { icon: '🌨️', desc: '雪粒' },
  80: { icon: '🌦️', desc: '小阵雨' },
  81: { icon: '🌦️', desc: '中阵雨' },
  82: { icon: '🌦️', desc: '大阵雨' },
  85: { icon: '🌨️', desc: '小阵雪' },
  86: { icon: '🌨️', desc: '大阵雪' },
  95: { icon: '⛈️', desc: '雷暴' },
  96: { icon: '⛈️', desc: '雷暴伴小冰雹' },
  99: { icon: '⛈️', desc: '雷暴伴大冰雹' },
};

const getWeatherInfo = (code: number) => {
  return weatherCodeMap[code] || { icon: '🌡️', desc: '未知' };
};

export default function WeatherWidget() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { size, setSize, isFullscreen, isExpanded } = useCardSize('standard');

  useEffect(() => {
    fetchWeather();
    
    // 每小时自动刷新一次
    const refreshInterval = setInterval(() => {
      fetchWeather();
    }, 60 * 60 * 1000); // 1小时 = 60 * 60 * 1000 毫秒

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取用户位置
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: false,
        });
      });

      const { latitude, longitude } = position.coords;

      // 并行获取天气数据和城市名称
      const [weatherResponse, geoResponse] = await Promise.all([
        fetch(`/api/weather?lat=${latitude}&lon=${longitude}`),
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`)
      ]);

      if (!weatherResponse.ok) {
        throw new Error('获取天气数据失败');
      }

      const weatherData = await weatherResponse.json();
      
      // 获取城市名称
      let locationName = '当前地区';
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        locationName = geoData.city || 
                      geoData.locality || 
                      geoData.principalSubdivision ||
                      geoData.countryName ||
                      '当前地区';
      }

      setWeatherData({
        ...weatherData,
        location: locationName
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('获取天气失败:', err);
      setError('无法获取天气信息，请确保已授权位置访问');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-shrink-0">
          <CardTitle>🌤️ 天气预报</CardTitle>
          <CardSizeControl size={size} onSizeChange={setSize} />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-shrink-0">
          <CardTitle>🌤️ 天气预报</CardTitle>
          <CardSizeControl size={size} onSizeChange={setSize} />
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-4xl mb-4">⚠️</p>
            <p>{error}</p>
            <button
              onClick={fetchWeather}
              className="mt-4 text-primary hover:underline"
            >
              重试
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weatherData) return null;

  const currentWeather = getWeatherInfo(weatherData.current.weathercode);

  // 获取当前时间，用于筛选显示从当前小时开始的数据
  const now = new Date();
  
  // 过滤出从当前小时开始的72小时数据
  const filteredHourlyData = weatherData.hourly.filter((item) => {
    const itemDate = new Date(item.time);
    const hoursDiff = (itemDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff >= 0 && hoursDiff <= 72;
  });

  // 按日期分组
  const groupedByDate = filteredHourlyData.reduce((acc, item) => {
    const date = new Date(item.time).toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric' 
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, HourlyForecastData[]>);

  const formatHour = (timeStr: string) => {
    const date = new Date(timeStr);
    const hour = date.getHours();
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  // 根据尺寸动态计算样式
  const getCardClassName = () => {
    if (isFullscreen) {
      return 'fixed inset-0 z-50 rounded-none m-0 bg-background flex flex-col';
    }
    return 'w-full h-full';
  };

  return (
    <Card className={getCardClassName()}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-shrink-0">
        <CardTitle>🌤️ 天气预报</CardTitle>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              更新于 {lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <span className="text-sm font-normal text-muted-foreground">
             {weatherData.location}
          </span>
          <CardSizeControl size={size} onSizeChange={setSize} />
        </div>
      </CardHeader>
      <CardContent className={`space-y-6 pb-0 ${isFullscreen ? 'flex-1 overflow-auto' : ''}`}>
        {/* 当前天气 */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-6xl">{currentWeather.icon}</span>
              <div>
                <div className="text-4xl font-bold text-foreground">
                  {Math.round(weatherData.current.temperature)}°C
                </div>
                <div className="text-lg text-muted-foreground">
                  {currentWeather.desc}
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground space-y-1">
              <div>💧 湿度: {weatherData.current.humidity}%</div>
              <div>💨 风速: {weatherData.current.windspeed} km/h</div>
            </div>
          </div>
        </div>

        {/* 7天预报 */}
        <div>
          <h3 className="font-semibold mb-3 text-foreground">未来7天</h3>
          <div className="grid grid-cols-7 gap-2">
            {weatherData.daily.map((day, index) => {
              const weather = getWeatherInfo(day.weathercode);
              const date = new Date(day.date);
              const dayName = index === 0 
                ? '今天' 
                : date.toLocaleDateString('zh-CN', { weekday: 'short' });
              
              return (
                <div
                  key={day.date}
                  className="text-center p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="text-xs text-muted-foreground mb-1">
                    {dayName}
                  </div>
                  <div className="text-2xl mb-1">{weather.icon}</div>
                  <div className="text-xs">
                    <div className="font-semibold">{Math.round(day.maxTemp)}°</div>
                    <div className="text-muted-foreground">{Math.round(day.minTemp)}°</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 72小时逐时预报 */}
        <div>
          <h3 className="font-semibold mb-3 text-foreground">72小时逐时预报</h3>
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {Object.entries(groupedByDate).map(([date, items]) => (
                <div key={date} className="flex-shrink-0">
                  {/* 日期标题 */}
                  <div className="text-sm font-semibold text-muted-foreground mb-2 text-center sticky top-0">
                    {date}
                  </div>
                  {/* 小时列表 */}
                  <div className="flex gap-2">
                    {items.map((item) => {
                      const weather = getWeatherInfo(item.weathercode);
                      return (
                        <div
                          key={item.time}
                          className="flex flex-col items-center p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors min-w-[60px]"
                        >
                          <div className="text-xs text-muted-foreground mb-1">
                            {formatHour(item.time)}
                          </div>
                          <div className="text-xl mb-1">{weather.icon}</div>
                          <div className="text-sm font-semibold">
                            {Math.round(item.temperature)}°
                          </div>
                          {item.precipitation > 0 && (
                            <div className="text-xs text-blue-500 mt-1">
                              💧{item.precipitation}%
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
