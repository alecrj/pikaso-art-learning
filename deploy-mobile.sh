#!/bin/bash
echo "📱 Setting up mobile deployment..."

# Login to Expo (you'll need to create account)
echo "Please create an Expo account at: https://expo.dev/signup"
echo "Then run: npx expo login"
echo ""

# Configure EAS
echo "After login, run these commands:"
echo "npx eas build:configure"
echo "npx eas build --platform all --profile production"
echo "npx eas submit --platform all"

echo "✅ Mobile deployment scripts ready"
