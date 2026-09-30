import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';

export function Calendar({ className, classNames, ...props }: ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays
      weekStartsOn={1}
      className={cn('p-2', className)}
      classNames={{
        months: 'relative',
        month: 'space-y-2',
        month_caption: 'flex h-8 items-center px-2',
        caption_label: 'text-13 font-medium text-fg',
        nav: 'absolute top-0 right-0 z-10 flex items-center gap-0.5',
        button_previous:
          'inline-flex size-8 items-center justify-center rounded-md text-subtle transition-colors hover:bg-card-hover hover:text-fg',
        button_next:
          'inline-flex size-8 items-center justify-center rounded-md text-subtle transition-colors hover:bg-card-hover hover:text-fg',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'flex size-8 items-center justify-center text-11 font-medium text-subtle',
        week: 'mt-0.5 flex',
        day: 'size-8 p-0 text-center',
        day_button:
          'inline-flex size-8 items-center justify-center rounded-md text-13 text-fg tabular transition-colors hover:bg-card-hover',
        selected: '[&>button]:bg-fg [&>button]:font-medium [&>button]:text-canvas',
        today: '[&>button]:font-semibold [&>button]:underline [&>button]:underline-offset-4',
        outside: '[&>button]:text-[#5f5f67]',
        disabled: 'opacity-40',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeftIcon className="size-4" />
          ) : (
            <ChevronRightIcon className="size-4" />
          ),
      }}
      {...props}
    />
  );
}
