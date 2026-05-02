"use client";

import { useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Priority, Status } from "@repo/db";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Task = {
  id: string;
  title: string;
  dueDate: string;
  status: Status;
  priority: Priority;
  projectName?: string;
};

export function CalendarView({ tasks }: { tasks: Task[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="glass">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentMonth(new Date())} className="glass">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="glass">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px rounded-xl border bg-muted overflow-hidden glass">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="bg-card/80 p-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
        
        {/* Empty slots for days before the 1st of the month */}
        {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-card/40 min-h-[100px]" />
        ))}

        {daysInMonth.map((day) => {
          const dayTasks = tasks.filter((task) =>
            isSameDay(parseISO(task.dueDate), day)
          );

          return (
            <div
              key={day.toString()}
              className={cn(
                "bg-card/80 min-h-[100px] p-2 transition-colors hover:bg-muted/50",
                isToday(day) && "bg-primary/5 font-semibold"
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday(day)
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground"
                )}
              >
                {format(day, "d")}
              </div>
              <div className="mt-2 flex flex-col gap-1">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "truncate rounded px-1.5 py-0.5 text-[10px] transition-all hover:scale-105 cursor-pointer",
                      task.status === Status.DONE
                        ? "bg-muted text-muted-foreground line-through"
                        : task.priority === Priority.HIGH
                        ? "bg-destructive/20 text-destructive-foreground"
                        : "bg-primary/20 text-primary"
                    )}
                    title={`${task.title} - ${task.projectName || ''}`}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
