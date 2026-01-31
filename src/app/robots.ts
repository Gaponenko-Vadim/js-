import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/login',
          '/register',
          '/tests',
          '/lectures',
        ],
        disallow: [
          '/api/',
          '/dashboard',
          '/results',
          '/my-lists',
          '/combined-test',
          '/pomodoro',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
