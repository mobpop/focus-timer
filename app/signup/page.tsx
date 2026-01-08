'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Create account
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'アカウント作成に失敗しました');
            }

            // Auto login
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                throw new Error(result.error);
            }

            router.push('/');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="glass-card">
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 'var(--space-sm)', textAlign: 'center' }}>
                    ⏱️ Focus Timer
                </h1>
                <p className="text-muted text-center mb-lg">アカウントを作成して始めよう</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                    <div>
                        <label className="label">ニックネーム（任意）</label>
                        <input
                            type="text"
                            className="input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="タイマーマスター"
                        />
                    </div>

                    <div>
                        <label className="label">メールアドレス</label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="label">パスワード</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="6文字以上"
                            minLength={6}
                            required
                        />
                    </div>

                    {error && (
                        <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>
                    )}

                    <button type="submit" className="btn btn-primary w-full mt-md" disabled={isLoading}>
                        {isLoading ? '作成中...' : 'アカウント作成'}
                    </button>
                </form>

                <p className="text-center text-muted mt-lg" style={{ fontSize: '0.875rem' }}>
                    既にアカウントをお持ちの方は{' '}
                    <Link href="/login" style={{ color: 'var(--color-primary)' }}>ログイン</Link>
                </p>
            </div>
        </div>
    );
}
