'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      const config: any = {
        loaded: (ph: any) => {
          if (process.env.NODE_ENV === 'development') ph.debug();
        }
      };
      if (process.env.NEXT_PUBLIC_POSTHOG_HOST) {
        config.api_host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
      }
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, config);
    }
  }, []);

  useEffect(() => {
    if (pathname) {
      let url = window.location.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture('$pageview', {
        $current_url: url
      });
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
