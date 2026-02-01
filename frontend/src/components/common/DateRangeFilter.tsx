import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, subDays, startOfMonth, startOfWeek } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangeFilterProps {
  className?: string
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
}

export function DateRangeFilter({
  className,
  date,
  onDateChange,
}: DateRangeFilterProps) {
  // const [date, setDate] = React.useState<DateRange | undefined>({
  //   from: new Date(2023, 0, 20),
  //   to: addDays(new Date(2023, 0, 20), 20),
  // })

  const handlePreset = (preset: 'today' | 'week' | 'month') => {
    const today = new Date();
    let from: Date;
    let to: Date = today;

    switch (preset) {
      case 'today':
        from = today;
        break;
      case 'week':
        from = startOfWeek(today);
        break;
      case 'month':
        from = startOfMonth(today);
        break;
    }

    if (onDateChange) {
        onDateChange({ from, to });
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-white/60",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-zinc-900 border-white/10" align="end">
            <div className="p-3 border-b border-white/10 flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handlePreset('today')} className="text-xs hover:bg-white/10 text-white/70 hover:text-white">Today</Button>
                <Button variant="ghost" size="sm" onClick={() => handlePreset('week')} className="text-xs hover:bg-white/10 text-white/70 hover:text-white">This Week</Button>
                <Button variant="ghost" size="sm" onClick={() => handlePreset('month')} className="text-xs hover:bg-white/10 text-white/70 hover:text-white">This Month</Button>
            </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
            className="text-white"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
