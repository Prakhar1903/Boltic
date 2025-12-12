import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, LayoutDashboard, Zap } from 'lucide-react';
import clsx from 'clsx';

export default function Navbar() {
    const location = useLocation();

    const isActive = (path: string) => location.pathname.startsWith(path);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <Zap className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-bold text-gray-900">PriceGuard</span>
                </div>

                <div className="flex gap-6">
                    <Link
                        to="/store"
                        className={clsx(
                            "flex items-center gap-2 text-sm font-medium transition-colors",
                            isActive('/store') ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        <ShoppingBag className="h-4 w-4" />
                        Store
                    </Link>
                    <Link
                        to="/dashboard"
                        className={clsx(
                            "flex items-center gap-2 text-sm font-medium transition-colors",
                            isActive('/dashboard') ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </Link>
                </div>
            </div>
        </nav>
    );
}
