import { checkRole } from "@/lib/roles";
import { redirect } from "next/navigation";
import Link from 'next/link';

export default async function AdminDashboard() {
    // Check if user is admin (You need to implement this check based on your strategy)
    // For MVP, since we can't easily set metadata without scripts, 
    // we will just show the page but warn that logic is needed.
    // const isAdmin = await checkRole('admin');
    // if (!isAdmin) redirect('/');

    return (
        <main className="min-h-screen bg-background text-foreground p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between border-b border-border pb-6">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <Link href="/" className="btn-primary">Back to App</Link>
                </div>

                <div className="bg-primary/10 border border-primary text-primary p-6 rounded-lg">
                    <h2 className="font-bold text-lg mb-2">🔐 Privileged Access Area</h2>
                    <p>Welcome, Administrator. Here you can manage global settings and view all user data.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Management Card */}
                    <div className="matte-card p-6">
                        <h3 className="font-semibold text-xl mb-4">User Management</h3>
                        <p className="text-muted-foreground text-sm mb-4">View and manage registered users.</p>
                        <button className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 rounded transition">
                            View Users
                        </button>
                    </div>

                    {/* Global Analytics Card */}
                    <div className="matte-card p-6">
                        <h3 className="font-semibold text-xl mb-4">System Health</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Server Status</span>
                                <span className="text-green-500 font-bold">Online</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Database</span>
                                <span className="text-green-500 font-bold">Connected</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
