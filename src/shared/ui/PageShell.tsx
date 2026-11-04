import type { ReactNode } from 'react';

/** Mobile-first page frame with the app name and an optional event name. */
export function PageShell({ appName, eventName, children, wide = false }: { appName: string; eventName?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-dvh bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className={`mx-auto flex items-center gap-3 px-4 py-3 ${wide ? 'max-w-5xl' : 'max-w-xl'}`}>
          <Logo />
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wide text-rose-700">{appName}</p>
            {eventName && <p className="truncate text-xs text-stone-500">{eventName}</p>}
          </div>
        </div>
      </header>
      <main className={`mx-auto px-4 py-6 ${wide ? 'max-w-5xl' : 'max-w-xl'}`}>{children}</main>
    </div>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-rose-600" />
      <circle cx="16" cy="17" r="6" fill="none" stroke="white" strokeWidth="2.5" />
      <rect x="11" y="7" width="10" height="4" rx="1.5" fill="white" />
    </svg>
  );
}
