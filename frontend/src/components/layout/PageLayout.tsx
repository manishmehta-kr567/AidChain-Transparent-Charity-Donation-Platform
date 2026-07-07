import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ToastContainer } from '../ui/ToastContainer';

export const PageLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen flex-col bg-white dark:bg-ink-950">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
    <ToastContainer />
  </div>
);
