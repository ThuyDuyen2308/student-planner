import React from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';

const WEEKDAYS = [
  { value: 'Monday', label: 'T2' },
  { value: 'Tuesday', label: 'T3' },
  { value: 'Wednesday', label: 'T4' },
  { value: 'Thursday', label: 'T5' },
  { value: 'Friday', label: 'T6' },
  { value: 'Saturday', label: 'T7' },
  { value: 'Sunday', label: 'CN' },
];

const START_HOUR = 7; // 07:00 AM
const END_HOUR = 21;  // 09:00 PM
const HOUR_HEIGHT = 60; // 60px per hour row

export default function CalendarView({ schedules }) {
  // Helper to parse "08:30:00" -> minutes from midnight
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const getPositionStyles = (startTime, endTime) => {
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    const dayStartMins = START_HOUR * 60;

    const top = ((startMins - dayStartMins) / 60) * HOUR_HEIGHT;
    const height = ((endMins - startMins) / 60) * HOUR_HEIGHT;

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  // Generate array of hours [7, 8, 9, ..., 20]
  const hourRows = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    hourRows.push(h);
  }

  return (
    <div className="glass-card" style={{ flex: 1, overflowX: 'auto' }}>
      <h3 className="gradient-text" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Calendar size={20} color="var(--secondary)" />
        Lịch Học Tuần (Google Calendar style)
      </h3>

      <div style={{ minWidth: '760px' }}>
        {/* Calendar Grid Header */}
        <div className="calendar-grid">
          {/* Top Left Empty Spacer Corner */}
          <div className="calendar-header-cell" style={{ borderRight: '1px solid var(--border-color)' }}>GMT+7</div>
          
          {WEEKDAYS.map(day => (
            <div key={day.value} className="calendar-header-cell">
              {day.label}
            </div>
          ))}
        </div>

        {/* Calendar Grid Body */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '60px repeat(7, 1fr)', 
            borderLeft: '1px solid var(--border-color)', 
            borderRight: '1px solid var(--border-color)', 
            borderBottom: '1px solid var(--border-color)', 
            background: 'rgba(255, 255, 255, 0.01)',
            position: 'relative',
            height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px`
          }}
        >
          {/* Left Time Markers Column */}
          <div 
            style={{ 
              gridColumn: '1', 
              display: 'flex', 
              flexDirection: 'column', 
              borderRight: '1px solid var(--border-color)',
              background: 'rgba(255, 255, 255, 0.02)'
            }}
          >
            {hourRows.map(hour => (
              <div 
                key={hour} 
                className="calendar-time-label"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                {hour < 10 ? `0${hour}` : hour}:00
              </div>
            ))}
          </div>

          {/* 7 Columns for weekdays */}
          {WEEKDAYS.map((day, dayIndex) => {
            const daySchedules = schedules.filter(s => s.day_of_week === day.value);

            return (
              <div 
                key={day.value} 
                className="calendar-day-column"
                style={{ 
                  gridColumn: `${dayIndex + 2}`,
                  borderRight: dayIndex < 6 ? '1px solid var(--border-color)' : 'none',
                  height: '100%',
                  position: 'relative'
                }}
              >
                {/* Horizontal Guide Lines */}
                {hourRows.map(hour => (
                  <div 
                    key={hour} 
                    style={{ 
                      position: 'absolute', 
                      top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`, 
                      left: 0, 
                      right: 0, 
                      height: `${HOUR_HEIGHT}px`, 
                      borderBottom: '1px dashed rgba(255, 255, 255, 0.02)',
                      pointerEvents: 'none'
                    }}
                  />
                ))}

                {/* Event Card Blocks */}
                {daySchedules.map(sch => {
                  const posStyles = getPositionStyles(sch.start_time, sch.end_time);
                  return (
                    <div 
                      key={sch.id}
                      className="calendar-event"
                      style={{
                        ...posStyles,
                        // Assigning different gradients or border highlights based on subject score
                        borderLeftColor: sch.subject_score >= 8.5 ? 'var(--secondary)' : 'var(--primary)'
                      }}
                    >
                      <div className="calendar-event-title" title={sch.subject_name}>
                        {sch.subject_name}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="calendar-event-time" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={10} />
                          {formatTime(sch.start_time)}-{formatTime(sch.end_time)}
                        </span>
                        
                        {sch.room && (
                          <span className="calendar-event-room" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={9} />
                            {sch.room}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
