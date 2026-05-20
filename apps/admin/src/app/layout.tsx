import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HamRah Admin Panel',
  description: 'Control center for the HamRah ride-hailing platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 flex h-screen overflow-hidden`}>
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white flex flex-col hidden md:flex">
          <div className="h-16 flex items-center justify-center border-b border-gray-800">
            <h1 className="text-2xl font-bold text-[#D4AF37]">HamRah Admin</h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            <a href="/" className="block px-4 py-3 rounded bg-gray-800 text-white font-medium">Dashboard</a>
            <a href="/drivers" className="block px-4 py-3 rounded hover:bg-gray-800 text-gray-300 font-medium">Driver Verifications</a>
            <a href="/rides" className="block px-4 py-3 rounded hover:bg-gray-800 text-gray-300 font-medium">Active Rides</a>
            <a href="/revenue" className="block px-4 py-3 rounded hover:bg-gray-800 text-gray-300 font-medium">Finance & Revenue</a>
            <a href="/users" className="block px-4 py-3 rounded hover:bg-gray-800 text-gray-300 font-medium">User Management</a>
          </nav>
          <div className="p-4 border-t border-gray-800">
            <button className="w-full py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors">
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="text-gray-500 font-medium">Welcome back, Super Admin</div>
            <div className="flex items-center space-x-4">
              <span className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-white font-bold">A</span>
            </div>
          </header>
          
          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
