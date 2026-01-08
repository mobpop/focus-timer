'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                router.push('/');
                router.refresh();
            }
        } catch {
            setError('ログインに失敗しました');
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
                <p className="text-muted text-center mb-lg">ログインして集中を始めよう</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-md">
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
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>
                    )}

                    <button type="submit" className="btn btn-primary w-full mt-md" disabled={isLoading}>
                        {isLoading ? 'ログイン中...' : 'ログイン'}
                    </button>
                </form>

                <p className="text-center text-muted mt-lg" style={{ fontSize: '0.875rem' }}>
                    アカウントをお持ちでない方は{' '}
                    <Link href="/signup" style={{ color: 'var(--color-primary)' }}>新規登録</Link>
                </p>
            </div>
        </div>
    );
}
