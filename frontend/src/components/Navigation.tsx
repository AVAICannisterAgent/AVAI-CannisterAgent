import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    Brain,
    Code,
    Github,
    Globe,
    Home,
    Menu,
    X
} from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = React.useState(false);

    const navItems = [
        {
            path: '/',
            label: 'Home',
            icon: Home,
            description: 'Main dashboard'
        },
        {
            path: '/demo',
            label: 'Canister Demo',
            icon: Code,
            description: 'Interactive demo'
        },
        {
            path: '/ai-logs',
            label: 'AI Analysis',
            icon: Brain,
            description: 'Real-time AI logs',
            badge: 'Live'
        }
    ];

    const NavLink: React.FC<{ item: any; mobile?: boolean }> = ({ item, mobile = false }) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
            <Link
                to={item.path}
                onClick={() => mobile && setIsOpen(false)}
                className={`
          flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200
          ${isActive
                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
          ${mobile ? 'w-full justify-start' : ''}
        `}
            >
                <Icon className="h-5 w-5" />
                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                                {item.badge}
                            </Badge>
                        )}
                    </div>
                    {mobile && (
                        <p className="text-xs text-gray-500">{item.description}</p>
                    )}
                </div>
            </Link>
        );
    };

    return (
        <>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center justify-between bg-white shadow-sm border-b px-6 py-4">
                <div className="flex items-center space-x-8">
                    <Link to="/" className="flex items-center space-x-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Brain className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">AVAI Agent</h1>
                            <p className="text-xs text-gray-500">AI Analysis Platform</p>
                        </div>
                    </Link>

                    <div className="flex items-center space-x-2">
                        {navItems.map((item) => (
                            <NavLink key={item.path} item={item} />
                        ))}
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" asChild>
                        <a
                            href="https://github.com/AVAICannisterAgent/AVAI-CannisterAgent"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2"
                        >
                            <Github className="h-4 w-4" />
                            <span>GitHub</span>
                        </a>
                    </Button>

                    <Button size="sm" asChild>
                        <a
                            href="https://websocket.avai.life/ws"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2"
                        >
                            <Globe className="h-4 w-4" />
                            <span>API</span>
                        </a>
                    </Button>
                </div>
            </nav>

            {/* Mobile Navigation */}
            <nav className="md:hidden bg-white shadow-sm border-b px-4 py-3">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Brain className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">AVAI Agent</h1>
                            <p className="text-xs text-gray-500">AI Analysis Platform</p>
                        </div>
                    </Link>

                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Menu className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold">Navigation</h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {navItems.map((item) => (
                                    <NavLink key={item.path} item={item} mobile />
                                ))}
                            </div>

                            <div className="border-t pt-6 mt-6 space-y-2">
                                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                                    <a
                                        href="https://github.com/AVAICannisterAgent/AVAI-CannisterAgent"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-2"
                                    >
                                        <Github className="h-4 w-4" />
                                        <span>View on GitHub</span>
                                    </a>
                                </Button>

                                <Button size="sm" className="w-full justify-start" asChild>
                                    <a
                                        href="https://websocket.avai.life/ws"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-2"
                                    >
                                        <Globe className="h-4 w-4" />
                                        <span>Access API</span>
                                    </a>
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </nav>
        </>
    );
};

export default Navigation;