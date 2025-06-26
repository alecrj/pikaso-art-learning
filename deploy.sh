#!/bin/bash
echo "🚀 Deploying Pikaso to production..."

# Build web version
npm run build:web

# Deploy to Vercel (create account if needed)
npx vercel --prod --yes

echo "✅ Deployment complete!"
echo "🌐 Your app is now LIVE on the web!"
