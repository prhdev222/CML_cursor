'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';
import { Heart } from 'lucide-react';

export default function ConditionalNavigation({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const pathname = usePathname();
  
  // Hide navigation and footer for patient portal pages
  const isPatientPortal = pathname?.includes('/patient/');
  
  if (isPatientPortal) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      {children}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-8 mt-auto border-t border-gray-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
              <h3 className="text-lg font-bold mb-3 text-gray-900">
                CML Management System
              </h3>
              <p className="text-gray-400 text-sm">
                Clinical Decision Support System for Chronic Myeloid Leukemia management
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-gray-300">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">NCCN Guidelines</a></li>
                <li><a href="#" className="hover:text-white transition-colors">ELN 2020</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Research Papers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-gray-300">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm font-medium">
              &copy; 2025 CML Management System. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm mt-2 md:mt-0 flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for healthcare professionals
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}



