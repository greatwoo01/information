import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json(
        { error: '缺少经纬度参数' },
        { status: 400 }
      );
    }

    // 调用 Open-Meteo API，添加小时级别预报（72小时）和7天日预报
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&hourly=temperature_2m,weather_code,precipitation_probability&timezone=auto&forecast_days=7`
    );

    if (!response.ok) {
      throw new Error('天气API请求失败');
    }

    const data: OpenMeteoResponse = await response.json();

    // 格式化返回数据
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
    };

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('获取天气数据失败:', error);
    return NextResponse.json(
      { error: '获取天气数据失败' },
      { status: 500 }
    );
  }
}
