'use client';

import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { format } from 'date-fns';
import type chineseDays from 'chinese-days';
import { CalendarDays, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// 该包的 ESM 入口与 package.json 声明不符，显式使用 CommonJS 入口。
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDayDetail, getLunarDate } = require('chinese-days/dist/index.min.js') as typeof chineseDays;

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const HOLIDAY_DATA_MIN_YEAR = 2004;
const HOLIDAY_DATA_MAX_YEAR = 2027;
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function getCalendarDayInfo(date: Date) {
  const dateKey = format(date, 'yyyy-MM-dd');
  const lunar = getLunarDate(dateKey);
  const dayDetail = getDayDetail(dateKey);
  const isOfficialArrangement = dayDetail.name.includes(',');

  return {
    lunar,
    dayDetail,
    isStatutoryHoliday: isOfficialArrangement && !dayDetail.work,
    isAdjustedWorkday: isOfficialArrangement && dayDetail.work,
    holidayName: isOfficialArrangement
      ? dayDetail.name.split(',')[1]
      : undefined,
  };
}

type CalendarDayInfo = ReturnType<typeof getCalendarDayInfo>;

function getLunarLabel(info: CalendarDayInfo) {
  const { lunar } = info;
  const monthName = `${lunar.isLeap ? '闰' : ''}${lunar.lunarMonCN}`;
  return lunar.lunarDay === 1 ? monthName : lunar.lunarDayCN;
}

function CalendarDayCell({
  day,
  modifiers,
  className,
  ...props
}: ComponentProps<typeof CalendarDayButton>) {
  const info = getCalendarDayInfo(day.date);
  const lunarLabel = getLunarLabel(info);
  const badge = info.isStatutoryHoliday
    ? '休'
    : info.isAdjustedWorkday
      ? '班'
      : null;

  return (
    <CalendarDayButton
      {...props}
      day={day}
      modifiers={modifiers}
      className={cn('p-0.5 sm:p-1', className)}
      aria-label={`${format(day.date, 'yyyy年M月d日')}，农历${info.lunar.lunarMonCN}${info.lunar.lunarDayCN}${badge ? `，${badge}` : ''}`}
    >
      <span className="relative flex h-full w-full flex-col items-center justify-center gap-1">
        {badge && (
          <span
            className={cn(
              'absolute right-0 top-0 rounded-sm px-1 text-[9px] font-medium leading-4 opacity-100',
              info.isStatutoryHoliday
                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
            )}
          >
            {badge}
          </span>
        )}
        <span className="text-sm font-semibold leading-none opacity-100 sm:text-base">
          {day.date.getDate()}
        </span>
        <span className="max-w-full truncate text-[9px] leading-none sm:text-[10px]">
          {lunarLabel}
        </span>
      </span>
    </CalendarDayButton>
  );
}

export default function PerpetualCalendar() {
  const [today, setToday] = useState<Date | null>(null);
  const [selected, setSelected] = useState<Date | null>(null);
  const [month, setMonth] = useState<Date | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const now = new Date();
      const currentDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      setToday(currentDate);
      setSelected(currentDate);
      setMonth(currentDate);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const selectedInfo = useMemo(
    () => (selected ? getCalendarDayInfo(selected) : null),
    [selected]
  );

  const handleBackToToday = () => {
    if (!today) return;
    setSelected(today);
    setMonth(today);
  };

  const hasHolidayData = month
    ? month.getFullYear() >= HOLIDAY_DATA_MIN_YEAR &&
      month.getFullYear() <= HOLIDAY_DATA_MAX_YEAR
    : true;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            万年历
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            公历、农历与中国法定假期调休
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-red-500" />
              法定放假
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-amber-500" />
              调休上班
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToToday}
            disabled={!today}
          >
            <RotateCcw className="size-4" />
            回到今天
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!today || !selected || !month || !selectedInfo ? (
          <Skeleton className="h-[430px] w-full" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <Calendar
                mode="single"
                month={month}
                onMonthChange={setMonth}
                selected={selected}
                onSelect={(date) => {
                  if (date) setSelected(date);
                }}
                captionLayout="dropdown"
                startMonth={new Date(MIN_YEAR, 0, 1)}
                endMonth={new Date(MAX_YEAR, 11, 1)}
                disabled={[
                  { before: new Date(MIN_YEAR, 0, 1) },
                  { after: new Date(MAX_YEAR, 11, 31) },
                ]}
                fixedWeeks
                className="w-full p-0 [--cell-size:2.75rem] sm:[--cell-size:4rem] lg:[--cell-size:4.25rem]"
                classNames={{
                  root: 'w-full',
                  months: 'w-full',
                  month: 'w-full',
                }}
                formatters={{
                  formatWeekdayName: (date) => `周${WEEKDAYS[date.getDay()]}`,
                  formatMonthDropdown: (date) => `${date.getMonth() + 1}月`,
                  formatYearDropdown: (date) => `${date.getFullYear()}年`,
                }}
                components={{
                  DayButton: CalendarDayCell,
                }}
              />
              <p className="mt-3 text-xs text-muted-foreground">
                {hasHolidayData
                  ? `法定假期及调休数据覆盖 ${HOLIDAY_DATA_MIN_YEAR}—${HOLIDAY_DATA_MAX_YEAR} 年`
                  : '该年份暂无官方假期/调休数据，仍可查看公历与农历'}
              </p>
            </div>

            <aside className="rounded-lg border bg-muted/30 p-5">
              <div className="text-sm text-muted-foreground">选中日期</div>
              <div className="mt-2 text-xl font-semibold">
                {format(selected, 'yyyy年M月d日')}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                星期{WEEKDAYS[selected.getDay()]}
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground">农历</div>
                  <div className="mt-1 font-medium">
                    {selectedInfo.lunar.lunarYearCN}年
                    {selectedInfo.lunar.isLeap ? '闰' : ''}
                    {selectedInfo.lunar.lunarMonCN}
                    {selectedInfo.lunar.lunarDayCN}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">干支生肖</div>
                  <div className="mt-1 font-medium">
                    {selectedInfo.lunar.yearCyl}年 · 属
                    {selectedInfo.lunar.zodiac}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">日期属性</div>
                  <div className="mt-2">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                        selectedInfo.isStatutoryHoliday
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : selectedInfo.isAdjustedWorkday
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {selectedInfo.isStatutoryHoliday
                        ? `${selectedInfo.holidayName} · 法定放假`
                        : selectedInfo.isAdjustedWorkday
                          ? `${selectedInfo.holidayName} · 调休上班`
                          : selectedInfo.dayDetail.work
                            ? '普通工作日'
                            : '周末'}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
