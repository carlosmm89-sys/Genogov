import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarWidgetProps {
    events: Array<{ date: string; status: 'WORKING' | 'FINISHED' | 'PAUSED' }>; // ISO dates
    selectedDate: Date | null;
    onDateSelect: (date: Date | null) => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ events, selectedDate, onDateSelect }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        return days;
    };

    const getFirstDayOfMonth = (date: Date) => {
        // 0 = Sunday, 1 = Monday. We want 0 = Monday in our grid usually, but let's stick to standard 0=Sun for easier logic or shift
        // getDay() 0 is Sunday.
        // Let's standard ISO: 0 (Mon) - 6 (Sun) visual or standard US 0 (Sun) - 6 (Sat).
        // Let's go with Monday start for Europe.
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1; // 0=Mon, 6=Sun
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const renderDays = () => {
        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
            // Check if this specific day has events
            // Events date string needs to be comparable. Assuming ISO YYYY-MM-DD or similar
            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

            const hasEvents = events.some(e => {
                const eDate = new Date(e.date);
                return eDate.getDate() === day && eDate.getMonth() === currentDate.getMonth() && eDate.getFullYear() === currentDate.getFullYear();
            });

            const isSelected = selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentDate.getMonth() &&
                selectedDate.getFullYear() === currentDate.getFullYear();

            const isToday = new Date().toDateString() === dayDate.toDateString();


            days.push(
                <button
                    key={day}
                    onClick={() => onDateSelect(dayDate)}
                    className={`
            h-9 w-9 flex flex-col items-center justify-center rounded-full text-xs font-medium relative transition-all
            ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-105' : 'hover:bg-slate-100 text-slate-700'}
            ${isToday && !isSelected ? 'border border-indigo-200 text-indigo-600 font-bold' : ''}
          `}
                >
                    {day}
                    {hasEvents && (
                        <span className={`absolute bottom-1 h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-400'}`} />
                    )}
                </button>
            );
        }
        return days;
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 w-full md:w-[300px] flex flex-col shrink-0 h-fit">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 capitalize">
                    {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 mb-2 text-center">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <span key={d} className="text-[10px] font-bold text-slate-400">{d}</span>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 place-items-center">
                {renderDays()}
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center">
                <button
                    onClick={() => {
                        onDateSelect(null);
                        setCurrentDate(new Date()); // Reset view to today
                    }}
                    className="text-xs text-indigo-600 font-medium hover:underline"
                >
                    Ver Todo (Volver a hoy)
                </button>
            </div>

        </div>
    );
};
