'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, MessageSquare, Calendar, User, Stethoscope, FileText, Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const isDoctor = user.role === 'doctor';
  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U';
  const isActive = (path: string) => pathname?.startsWith(path);

  const navLinks = [
    { 
      href: '/chat', 
      icon: <MessageSquare className="h-5 w-5 mr-1.5" />, 
      text: 'Chat' 
    },
    ...(isDoctor 
      ? [
          { 
            href: '/appointments', 
            icon: <Calendar className="h-5 w-5 mr-1.5" />, 
            text: 'Appointments' 
          },
          { 
            href: '/patients', 
            icon: <User className="h-5 w-5 mr-1.5" />, 
            text: 'Patients' 
          },
        ]
      : [
          { 
            href: '/records', 
            icon: <FileText className="h-5 w-5 mr-1.5" />, 
            text: 'Medical Records' 
          },
        ]
    ),
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/chat" className="text-xl font-bold text-blue-600">
              HealthChat
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive(link.href)
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {link.icon}
                  {link.text}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:ml-6 md:flex md:items-center">
            <div className="ml-3 relative">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                    {userInitial}
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-700">{user.name || user.email}</p>
                  <p className="text-xs text-gray-500">{isDoctor ? 'Doctor' : 'Patient'}</p>
                </div>
                <button
                  onClick={logout}
                  className="ml-4 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-3 py-2 text-base font-medium ${
                  isActive(link.href)
                    ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:border-l-4 hover:border-gray-300 hover:text-gray-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.icon}
                <span className="ml-3">{link.text}</span>
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-lg">
                  {userInitial}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user.name || user.email}</div>
                <div className="text-sm font-medium text-gray-500">{isDoctor ? 'Doctor' : 'Patient'}</div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="ml-auto flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Sign out"
              >
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};