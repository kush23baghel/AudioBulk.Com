import { useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import Navbar from './Navbar';
import Footer from './Footer';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import PageTransition from './PageTransition';
import CommandPalette from './CommandPalette';
import { toolsList, toolCategories } from '../data/tools';
import useRecentTools from '../hooks/useRecentTools';

export default function Layout() {
  const location = useLocation();
  const { addRecentTool } = useRecentTools();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // spring-like feel
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Scroll to top and track recent tool on route change
  useEffect(() => {
    window.scrollTo(0, 0);

    // Track Recent Tools globally
    if (location.pathname.startsWith('/tools/')) {
      const tool = toolsList.find(t => t.path === location.pathname);
      if (tool) {
        const cat = toolCategories.find(c => c.id === tool.categoryId);
        addRecentTool({
          name: tool.name,
          path: tool.path,
          icon: tool.icon,
          category: cat ? cat.title : 'Tools'
        });
      }
    }
  }, [location.pathname, addRecentTool]);

  return (
    <div className="flex flex-col min-h-screen text-slate-100" style={{ background: '#060e20' }}>
      {/* Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <span className="loading loading-spinner loading-lg text-sky-500"></span>
                <p className="text-xs text-slate-400 font-medium">Initializing tool components...</p>
              </div>
            }>
              <Outlet />
            </Suspense>
          </PageTransition>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />
      
      {/* Premium Toast Notifications */}
      <Toaster 
        theme="dark" 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: 'rgba(15, 25, 48, 0.90)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#dee5ff',
            fontFamily: 'Inter, system-ui, sans-serif'
          }
        }}
      />

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
}

