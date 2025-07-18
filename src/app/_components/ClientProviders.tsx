'use client';


import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SessionProvider } from '@/lib/providers/session-provider';
import { TRPCReactProvider } from '@/trpc/react';
import { LanguageProvider } from '@/lib/language-context';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <TRPCReactProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </TRPCReactProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
