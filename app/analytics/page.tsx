'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Session {
    id: string;
    startTime: string;
    endTime: string;
    duration: number;
    subject: {
        id: string;
        name: string;
        color: string;
    };
}

interface DayData {
    date: string;
    totalMinutes: number;
    sessions: Session[];
}

export default function AnalyticsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (session) {
            fetchSessions();
        }
    }, [session, currentMonth]);

    const fetchSessions = async () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const from = new Date(year, month, 1).toISOString();
        const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

        try {
            const res = await fetch(`/api/sessions?from=${from}&to=${to}`);
            const data = await res.json();
            setSessions(data);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Calendar data
    const calendarData = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const days: (DayData | null)[] = [];

        // Empty cells before first day
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const daySessions = sessions.filter(s => s.startTime.startsWith(dateStr));
            const totalMinutes = daySessions.reduce((sum, s) => sum + Math.round(s.duration / 60), 0);

            days.push({
                date: dateStr,
                totalMinutes,
                sessions: daySessions,
            });
        }

        return days;
    }, [currentMonth, sessions]);

    // Pie chart data
    const pieData = useMemo(() => {
        const subjectTotals: Record<string, { name: string; color: string; minutes: number }> = {};

        sessions.forEach(s => {
            if (!subjectTotals[s.subject.id]) {
                subjectTotals[s.subject.id] = {
                    name: s.subject.name,
                    color: s.subject.color,
                    minutes: 0,
                };
            }
            subjectTotals[s.subject.id].minutes += Math.round(s.duration / 60);
        });

        return Object.values(subjectTotals).map(s => ({
            name: s.name,
            value: s.minutes,
            color: s.color,
        }));
    }, [sessions]);

    const totalMinutes = useMemo(() => {
        return sessions.reduce((sum, s) => sum + Math.round(s.duration / 60), 0);
    }, [sessions]);

    const formatMinutes = (mins: number) => {
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        if (hours > 0) {
            return `${hours}時間${minutes}分`;
        }
        return `${minutes}分`;
    };

    const navigateMonth = (delta: number) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
        setSelectedDate(null);
    };

    const selectedDaySessions = useMemo(() => {
        if (!selectedDate) return [];
        return sessions.filter(s => s.startTime.startsWith(selectedDate));
    }, [selectedDate, sessions]);

    if (status === 'loading' || isLoading) {
        return (
            <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="text-muted">読み込み中...</p>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="container" style={{ minHeight: '100vh', paddingBottom: '100px' }}>
            <header style={{ paddingTop: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>📊 分析</h1>
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                    月間の集中時間を確認
                </p>
            </header>

            {/* Month Navigator */}
            <div className="glass-card flex items-center justify-between mb-lg" style={{ padding: 'var(--space-md)' }}>
                <button className="btn btn-ghost" onClick={() => navigateMonth(-1)}>←</button>
                <span style={{ fontWeight: 600 }}>
                    {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                </span>
                <button className="btn btn-ghost" onClick={() => navigateMonth(1)}>→</button>
            </div>

            {/* Total Time */}
            <div className="glass-card mb-lg text-center">
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>月間合計</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {formatMinutes(totalMinutes)}
                </p>
            </div>

            {/* Pie Chart */}
            {pieData.length > 0 && (
                <div className="glass-card mb-lg" style={{ height: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                paddingAngle={2}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number | string | Array<number | string>) => formatMinutes(Number(value))}
                                contentStyle={{
                                    background: 'var(--color-surface)',
                                    border: 'var(--glass-border)',
                                    borderRadius: 'var(--radius-md)',
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Calendar */}
            <div className="glass-card mb-lg">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '2px',
                    textAlign: 'center',
                }}>
                    {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                        <div key={day} style={{
                            padding: 'var(--space-sm)',
                            color: 'var(--color-text-muted)',
                            fontSize: '0.75rem',
                        }}>
                            {day}
                        </div>
                    ))}
                    {calendarData.map((day, index) => (
                        <div
                            key={index}
                            onClick={() => day && setSelectedDate(day.date)}
                            style={{
                                padding: 'var(--space-sm)',
                                minHeight: '50px',
                                background: day && selectedDate === day.date ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                borderRadius: 'var(--radius-sm)',
                                cursor: day ? 'pointer' : 'default',
                                opacity: day ? 1 : 0.3,
                            }}
                        >
                            {day && (
                                <>
                                    <div style={{ fontSize: '0.875rem' }}>
                                        {parseInt(day.date.split('-')[2])}
                                    </div>
                                    {day.totalMinutes > 0 && (
                                        <div style={{
                                            fontSize: '0.625rem',
                                            color: 'var(--color-primary)',
                                            fontWeight: 500,
                                        }}>
                                            {day.totalMinutes}分
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Selected Day Sessions */}
            {selectedDate && (
                <div className="glass-card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                        {selectedDate.replace(/-/g, '/')} のセッション
                    </h3>
                    {selectedDaySessions.length > 0 ? (
                        <div className="flex flex-col gap-sm">
                            {selectedDaySessions.map(s => (
                                <div
                                    key={s.id}
                                    className="flex items-center gap-md"
                                    style={{
                                        padding: 'var(--space-sm)',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: 'var(--radius-sm)',
                                    }}
                                >
                                    <span
                                        className="color-dot"
                                        style={{ backgroundColor: s.subject.color }}
                                    />
                                    <span style={{ flex: 1 }}>{s.subject.name}</span>
                                    <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                                        {formatMinutes(Math.round(s.duration / 60))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted">セッションがありません</p>
                    )}
                </div>
            )}

            {/* Bottom Navigation */}
            <nav className="nav">
                <Link href="/" className="nav-item">
                    <span className="nav-icon">⏱️</span>
                    <span>タイマー</span>
                </Link>
                <Link href="/subjects" className="nav-item">
                    <span className="nav-icon">📚</span>
                    <span>科目</span>
                </Link>
                <Link href="/analytics" className="nav-item active">
                    <span className="nav-icon">📊</span>
                    <span>分析</span>
                </Link>
            </nav>
        </div>
    );
}
