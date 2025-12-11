'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { Shirt, Cloud } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/upload', label: 'Upload' },
    { href: '/wardrobe', label: 'Wardrobe' },
    { href: '/face-recommend', label: 'Face Analysis' },
    { href: '/style-quiz', label: 'Style Quiz' },
    { href: '/outfits', label: 'Outfits' },
    { href: '/styling-tips', label: 'Tips' },
    { href: '/shopping', label: 'Shopping' },
    { href: '/trends', label: 'Trends' },
  ];

  return (
    <nav className="bg-white dark:bg-black border-b-2 border-[#231212] dark:border-white shadow-lg transition-colors duration-smooth">
      <div className="w-full px-3 md:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2">
            <Shirt className="w-6 h-6 md:w-8 md:h-8 text-[#231212] dark:text-white" />
            <h1 className="text-xl md:text-2xl lg:text-3xl font-display text-[#231212] dark:text-white">
              Curator
            </h1>
          </Link>
          <div className="hidden md:flex justify-between flex-grow mx-8 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center px-2 py-1 border-b-2 text-sm md:text-base font-body transition-colors duration-smooth ${
                  pathname === item.href
                    ? 'border-[#231212] dark:border-white text-[#231212] dark:text-white font-semibold'
                    : 'border-transparent text-black dark:text-white hover:border-[#231212] dark:hover:border-white opacity-70 hover:opacity-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/test-s3-upload"
              className="p-2 rounded-md border-2 border-[#231212] dark:border-white hover:bg-[#231212] dark:hover:bg-white text-[#231212] dark:text-white hover:text-white dark:hover:text-black transition-all duration-smooth"
              title="Test S3 Upload"
            >
              <Cloud className="w-5 h-5" />
            </Link>
            <ThemeToggle />
            <div className="md:hidden">
              <button className="p-2 rounded-md border-2 border-[#231212] dark:border-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div className="md:hidden border-t-2 border-[#231212] dark:border-white">
        <div className="px-3 py-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm font-body transition-colors ${
                pathname === item.href
                  ? 'bg-[#231212] dark:bg-white text-white dark:text-black font-semibold'
                  : 'text-black dark:text-white hover:bg-neutral-soft dark:hover:bg-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

