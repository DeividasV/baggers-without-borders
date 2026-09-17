"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  label?: string;
  value?: string; // ISO date string (YYYY-MM-DD)
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  minDate?: string; // ISO date string
  maxDate?: string; // ISO date string
}

export default function DatePicker({
  label,
  value,
  onChange,
  placeholder = "Select date",
  required = false,
  disabled = false,
  error,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const pickerRef = useRef<HTMLDivElement>(null);

  // Parse the value or use current date for initial display
  useEffect(() => {
    if (value) {
      const date = new Date(value + "T00:00:00");
      if (!isNaN(date.getTime())) {
        setCurrentMonth(date);
      }
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    // Adjust so Monday = 0
    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek < 0) firstDayOfWeek = 6;

    const daysInMonth = lastDay.getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: (Date | null)[] = [];

    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, daysInPrevMonth - i));
    }

    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const handleYearChange = (increment: number) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear() + increment, currentMonth.getMonth())
    );
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex));
  };

  const handleYearSelect = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth()));
  };

  // Generate year options (100 years back and 10 years forward)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: 110 },
    (_, i) => currentYear - 100 + i
  );

  const monthOptions = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const isoDate = `${year}-${month}-${day}`;

    // Check if date is within min/max range
    if (minDate && isoDate < minDate) return;
    if (maxDate && isoDate > maxDate) return;

    onChange(isoDate);
    setIsOpen(false);
  };

  const isDateSelected = (date: Date) => {
    if (!value) return false;
    const isoDate = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return isoDate === value;
  };

  const isDateDisabled = (date: Date) => {
    const isoDate = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    if (minDate && isoDate < minDate) return true;
    if (maxDate && isoDate > maxDate) return true;
    return false;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long" });
  const year = currentMonth.getFullYear();
  const days = getDaysInMonth(currentMonth);

  return (
    <div className="space-y-2" ref={pickerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-400">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={value ? value.split("T")[0] : ""}
          onChange={(e) => {
            const inputValue = e.target.value;
            // Allow typing in YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(inputValue)) {
              onChange(inputValue);
            } else if (inputValue === "") {
              onChange("");
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(true)}
          className={`
            w-full px-4 py-2 pr-10
            bg-[#1a1a1a] border border-[#4f4f4f] rounded-lg
            text-gray-100 placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all duration-200
            ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-gray-600"
            }
            ${error ? "border-red-500" : ""}
          `}
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <Calendar
            className={`h-5 w-5 ${
              disabled ? "text-gray-600" : "text-gray-400"
            }`}
          />
        </button>
      </div>

      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}

      {isOpen && !disabled && (
        <div className="absolute z-40 mt-2 bg-[#1a1a1a] border border-[#4f4f4f] rounded-lg shadow-xl p-4 min-w-[320px]">
          {/* Header with Month/Year controls */}
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="h-5 w-5 text-gray-300" />
            </button>

            <div className="flex-1 flex gap-2">
              <select
                value={currentMonth.getMonth()}
                onChange={(e) => handleMonthSelect(Number(e.target.value))}
                className="flex-1 px-3 py-1.5 bg-[#1a1a1a] border border-[#4f4f4f] rounded text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer hover:border-gray-600 transition-colors"
              >
                {monthOptions.map((month, index) => (
                  <option
                    key={month}
                    value={index}
                    className="bg-[#1a1a1a] text-gray-200"
                  >
                    {month}
                  </option>
                ))}
              </select>

              <select
                value={currentMonth.getFullYear()}
                onChange={(e) => handleYearSelect(Number(e.target.value))}
                className="px-3 py-1.5 bg-[#1a1a1a] border border-[#4f4f4f] rounded text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer hover:border-gray-600 transition-colors [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#1a1a1a] [&::-webkit-scrollbar-thumb]:bg-[#4f4f4f] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-gray-500"
              >
                {yearOptions.map((yearOption) => (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Next month"
            >
              <ChevronRight className="h-5 w-5 text-gray-300" />
            </button>
          </div>

          {/* Weekday headers (Monday to Sunday) */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
              <div
                key={day}
                className="text-xs font-medium text-gray-500 text-center py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) return <div key={index} />;

              const selected = isDateSelected(date);
              const today = isToday(date);
              const currentMonth = isCurrentMonth(date);
              const disabled = isDateDisabled(date);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => !disabled && handleDateSelect(date)}
                  disabled={disabled}
                  className={`
                    h-9 text-sm rounded-md transition-colors
                    ${selected ? "bg-primary-500 text-white font-semibold" : ""}
                    ${
                      !selected && today
                        ? "border border-primary-500 text-primary-400 font-medium"
                        : ""
                    }
                    ${
                      !selected && !today && currentMonth
                        ? "text-gray-200 hover:bg-gray-700"
                        : ""
                    }
                    ${
                      !selected && !today && !currentMonth
                        ? "text-gray-600"
                        : ""
                    }
                    ${
                      disabled
                        ? "opacity-40 cursor-not-allowed"
                        : "cursor-pointer"
                    }
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Today and Clear buttons */}
          <div className="mt-3 pt-3 border-t border-gray-700 flex gap-2">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                handleDateSelect(today);
              }}
              className="px-4 py-2 text-sm text-primary-400 hover:text-primary-300 hover:bg-gray-700 rounded transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
