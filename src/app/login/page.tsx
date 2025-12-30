'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (res.ok) {
                router.push('/');
                router.refresh(); // Ensure middleware re-runs or state updates
            } else {
                const data = await res.json();
                setError(data.message || 'Invalid credentials');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#050505] text-white">
            <div className="matte-card p-8 md:p-12 w-full max-w-md animate-fade">
                <div className="mb-10 flex flex-col items-center justify-center">
                    <div className="relative w-48 h-24 mb-4">
                        {/* Using the same logo as main page for consistency */}
                        <Image
                            src="/logo.png"
                            alt="DeepLinker Logo"
                            fill
                            className="object-contain mix-blend-screen"
                            priority
                        />
                    </div>
                    <p className="text-sm text-gray-500">
                        Internal Access Only
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 ml-1 mb-1 block">Username</label>
                            <input
                                type="text"
                                placeholder="Enter username"
                                className="input-minimal"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 ml-1 mb-1 block">Password</label>
                            <input
                                type="password"
                                placeholder="Enter password"
                                className="input-minimal"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>

                    {error && (
                        <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-lg text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}
                </form>
            </div>
        </main>
    );
}
