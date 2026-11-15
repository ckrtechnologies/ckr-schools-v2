export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://schoolkarma.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/admin/',
          '/superadmin/',
          '/spoc/',
          '/admission/',
          '/finance/',
          '/timetable/',
          '/tc/',
          '/teacher-manager/',
          '/academic-manager/'
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/superadmin/',
          '/spoc/'
        ]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}

