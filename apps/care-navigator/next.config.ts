import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Type annotation omitted to avoid cross-version NextConfig incompatibility in monorepo
const nextConfig = {
  experimental: {
    // Needed for iron-session in App Router
    serverActions: {
      allowedOrigins: ['localhost:3001', '*.vercel.app'],
    },
  },
};

export default withNextIntl(nextConfig);
