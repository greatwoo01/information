import { NextRequest, NextResponse } from 'next/server';

interface IpLocationResponse {
  success: boolean;
  message?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
  };
}

function getClientIp(request: NextRequest) {
  const forwardedIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
  const clientIp = forwardedIp || request.headers.get('x-real-ip')?.trim() || '';
  return clientIp.replace(/^::ffff:/, '');
}

function isPrivateIp(ip: string) {
  return /^(0\.|10\.|127\.|169\.254\.|192\.168\.|::1$|fc|fd|fe80)/i.test(ip)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
}

async function getIpLocation(request: NextRequest) {
  const clientIp = getClientIp(request);
  const ipPath = clientIp && !isPrivateIp(clientIp)
    ? `/${encodeURIComponent(clientIp)}`
    : '';
  const response = await fetch(`https://ipwho.is${ipPath}?lang=zh-CN`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('IP定位API请求失败');
  }

  const data: IpLocationResponse = await response.json();
  if (!data.success || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
    throw new Error(data.message || '无法根据IP获取位置');
  }

  return {
    lat: data.latitude,
    lon: data.longitude,
    location: data.city || data.region || data.country || '当前地区',
  };
}

export async function GET(request: NextRequest) {
  try {
    const { lat, lon, location } = await getIpLocation(request);

    // 根据服务端IP定位结果获取小时级和7天天气预报
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&hourly=temperature_2m,weather_code,precipitation_probability&timezone=auto&forecast_days=7`
    );

    if (!response.ok) {
      throw new Error('天气API请求失败');
    }

    const data: OpenMeteoResponse = await response.json();

    const weatherData = {
      current: {
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        windspeed: data.current.wind_speed_10m,
        weathercode: data.current.weather_code,
      },
      daily: data.daily.time.map((time, index) => ({
        date: time,
        maxTemp: data.daily.temperature_2m_max[index],
        minTemp: data.daily.temperature_2m_min[index],
        weathercode: data.daily.weather_code[index],
      })),
      hourly: data.hourly.time.map((time, index) => ({
        time: time,
        temperature: data.hourly.temperature_2m[index],
        weathercode: data.hourly.weather_code[index],
        precipitation: data.hourly.precipitation_probability[index],
      })),
      location,
    };

    return NextResponse.json(weatherData, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('获取天气数据失败:', error);
    return NextResponse.json(
      { error: '获取天气数据失败' },
      { status: 500 }
    );
  }
}
