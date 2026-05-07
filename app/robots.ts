import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/signup', '/password'],
        disallow: [
          '/home',
          '/inbox',
          '/rfq',
          '/settings',
          '/playground',
          '/api/',
          '/invite/',
          '/auth/',
          '/logout',
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
