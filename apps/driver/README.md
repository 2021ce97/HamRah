# HamRah Driver App

A React Native (Expo) app for drivers to receive ride requests and manage trips via the HamRah platform.

## Connecting to the Railway backend

The app reads the backend URL from the `EXPO_PUBLIC_API_URL` environment variable. The central API configuration lives in `src/config/api.ts` and exports `API_BASE_URL` plus pre-built `API_ENDPOINTS` that can be imported anywhere in the driver app.

Before running or building the app you must set this variable to your Railway-deployed backend domain.

1. Copy the example env file:

   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and replace the placeholder with your actual Railway domain:

   ```
   EXPO_PUBLIC_API_URL=https://your-railway-domain.up.railway.app
   ```

   You can find the domain in the Railway dashboard under your backend service's **Settings → Networking → Public Networking** section.

3. Import the config wherever you need to make API calls:

   ```ts
   import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
   ```

> **Note:** `.env.local` is gitignored. Never commit real credentials or URLs to version control — use `.env.example` as the reference template instead.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
