'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Subject {
    id: string;
    name: string;
    color: string;
    icon: string | null;
}

const COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#ef4444', '#f97316',
    '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
];

export default function SubjectsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [name, setName] = useState('');
    const [color, setColor] = useState('#6366f1');
    const [error, setError] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (session) {
            fetchSubjects();
        }
    }, [session]);

    const fetchSubjects = async () => {
        try {
            const res = await fetch('/api/subjects');
            const data = await res.json();
            setSubjects(data);
        } catch (error) {
            console.error('Failed to fetch subjects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = (subject?: Subject) => {
        if (subject) {
            setEditingSubject(subject);
            setName(subject.name);
            setColor(subject.color);
        } else {
            setEditingSubject(null);
            setName('');
            setColor('#6366f1');
        }
        setError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingSubject(null);
        setName('');
        setColor('#6366f1');
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('科目名を入力してください');
            return;
        }

        try {
            if (editingSubject) {
                // Update
                const res = await fetch(`/api/subjects/${editingSubject.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, color }),
                });
                if (!res.ok) throw new Error('更新に失敗しました');
            } else {
                // Create
                const res = await fetch('/api/subjects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, color }),
                });
                if (!res.ok) throw new Error('作成に失敗しました');
            }

            closeModal();
            fetchSubjects();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('この科目を削除しますか？関連するセッションも削除されます。')) {
            return;
        }

        try {
            const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('削除に失敗しました');
            fetchSubjects();
        } catch (error) {
            console.error('Failed to delete subject:', error);
            alert('削除に失敗しました');
        }
    };

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
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>📚 科目管理</h1>
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                    集中する科目を追加・編集できます
                </p>
            </header>

            {/* Subject List */}
            <div className="flex flex-col gap-md">
                {subjects.map(subject => (
                    <div
                        key={subject.id}
                        className="glass-card flex items-center justify-between"
                        style={{ padding: 'var(--space-md) var(--space-lg)' }}
                    >
                        <div className="flex items-center gap-md">
                            <span
                                className="color-dot"
                                style={{
                                    backgroundColor: subject.color,
                                    width: '20px',
                                    height: '20px',
                                }}
                            />
                            <span style={{ fontWeight: 500 }}>{subject.name}</span>
                        </div>
                        <div className="flex gap-sm">
                            <button
                                className="btn btn-ghost btn-icon"
                                onClick={() => openModal(subject)}
                                style={{ width: '40px', height: '40px' }}
                            >
                                ✏️
                            </button>
                            <button
                                className="btn btn-ghost btn-icon"
                                onClick={() => handleDelete(subject.id)}
                                style={{ width: '40px', height: '40px', color: 'var(--color-error)' }}
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Button */}
            <button
                className="btn btn-primary w-full mt-lg"
                onClick={() => openModal()}
            >
                + 科目を追加
            </button>

            {/* Modal */}
            {showModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100,
                        padding: 'var(--space-md)',
                    }}
                    onClick={closeModal}
                >
                    <div
                        className="glass-card"
                        style={{ width: '100%', maxWidth: '400px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>
                            {editingSubject ? '科目を編集' : '科目を追加'}
                        </h2>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                            <div>
                                <label className="label">科目名</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="例：英語、プログラミング"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="label">カラー</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 'var(--space-xs)' }}>
                                    {COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: 'var(--radius-full)',
                                                backgroundColor: c,
                                                border: color === c ? '3px solid white' : 'none',
                                                cursor: 'pointer',
                                                transition: 'transform var(--transition-fast)',
                                                transform: color === c ? 'scale(1.1)' : 'scale(1)',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>
                            )}

                            <div className="flex gap-sm mt-md">
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={closeModal}>
                                    キャンセル
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    {editingSubject ? '更新' : '追加'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <nav className="nav">
                <Link href="/" className="nav-item">
                    <span className="nav-icon">⏱️</span>
                    <span>タイマー</span>
                </Link>
                <Link href="/subjects" className="nav-item active">
                    <span className="nav-icon">📚</span>
                    <span>科目</span>
                </Link>
                <Link href="/analytics" className="nav-item">
                    <span className="nav-icon">📊</span>
                    <span>分析</span>
                </Link>
            </nav>
        </div>
    );
}
