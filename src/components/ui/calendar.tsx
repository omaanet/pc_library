"use client"

import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    fixedWeeks = true,
    navLayout = "around",
    components,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            fixedWeeks={fixedWeeks}
            navLayout={navLayout}
            className={cn("p-3", className)}
            classNames={{
                root: "relative",
                months: "flex flex-col gap-4",
                month: "relative flex w-full flex-col gap-4",
                month_caption: "flex h-8 items-center justify-center px-10",
                caption_label: "inline-flex items-center text-sm font-medium",
                dropdowns: "flex items-center justify-center gap-2",
                dropdown_root:
                    "relative inline-flex h-8 items-center rounded-md border border-input bg-background px-2 shadow-sm focus-within:ring-1 focus-within:ring-ring",
                dropdown: "absolute inset-0 z-10 cursor-pointer opacity-0",
                chevron: "ml-1 h-3.5 w-3.5 opacity-60",
                nav: "absolute inset-x-0 top-0 flex h-8 items-center justify-between",
                button_previous: cn(
                    buttonVariants({ variant: "outline" }),
                    "absolute left-0 top-0 h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 aria-disabled:pointer-events-none aria-disabled:opacity-30"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline" }),
                    "absolute right-0 top-0 h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 aria-disabled:pointer-events-none aria-disabled:opacity-30"
                ),
                month_grid: "w-full border-collapse",
                weekdays: "flex",
                weekday:
                    "w-9 rounded-md text-center text-[0.8rem] font-normal text-muted-foreground",
                week: "mt-2 flex w-full",
                day: "relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 rounded-md p-0 font-normal aria-selected:opacity-100"
                ),
                range_start: "rounded-l-md bg-accent",
                range_middle: "rounded-none bg-accent",
                range_end: "rounded-r-md bg-accent",
                selected:
                    "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:shadow-sm [&>button:hover]:bg-primary [&>button:hover]:text-primary-foreground [&>button:focus-visible]:bg-primary [&>button:focus-visible]:text-primary-foreground",
                today:
                    "[&>button]:border [&>button]:border-primary [&>button]:font-semibold [&>button]:text-accent-foreground",
                outside:
                    "text-muted-foreground opacity-50 [&>button[aria-selected=true]]:bg-accent/50 [&>button[aria-selected=true]]:text-muted-foreground",
                disabled:
                    "text-muted-foreground opacity-40 [&>button]:cursor-not-allowed",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ className: chevronClassName, orientation }) => {
                    const Icon = orientation === "left"
                        ? ChevronLeft
                        : orientation === "right"
                            ? ChevronRight
                            : orientation === "up"
                                ? ChevronUp
                                : ChevronDown

                    return <Icon className={cn("h-4 w-4", chevronClassName)} />
                },
                ...components,
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
