import { appConfig } from '../../core/config';
import { messages } from '../../shared/content';
import { PageShell } from '../../shared/ui';

export function NotFoundRoute() {
  return (
    <PageShell appName={appConfig.appName}>
      <div className="space-y-3 py-10 text-center">
        <h1 className="text-2xl font-bold">{messages.errors.notFoundTitle}</h1>
        <p className="text-stone-600">{messages.errors.notFound}</p>
      </div>
    </PageShell>
  );
}
