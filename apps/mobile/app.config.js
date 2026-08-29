const IS_DEV = process.env.APP_VARIANT === "development";

export default {
  expo: {
    ...(IS_DEV
      ? {
          name: "Noted (Dev)",
          scheme: "noted-dev",
        }
      : {
          name: "Noted",
          scheme: "noted",
        }),
    slug: "noted",
    version: "1.10.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    assetBundlePatterns: ["**/*"],
    experiments: {
      reactCompiler: true,
    },
    ios: {
      supportsTablet: true,
      icon: {
        light: "./assets/icon.png",
        tinted: "./assets/icon-tinted.png",
      },
      bundleIdentifier: IS_DEV
        ? "app.noted.notedmobile.dev"
        : "app.noted.notedmobile",
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          image: "./assets/splash-white.png",
          resizeMode: "contain",
          backgroundColor: "#000000",
        },
      },
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
        },
      },
      buildNumber: "44",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000",
        monochromeImage: "./assets/adaptive-icon.png",
      },
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          image: "./assets/splash-white.png",
          resizeMode: "contain",
          backgroundColor: "#000000",
        },
      },
      package: IS_DEV ? "app.noted.notedmobile.dev" : "app.noted.notedmobile",
      versionCode: 44,
    },
    plugins: [
      "./plugins/trust-local-certs.js",
      "./plugins/camera-not-required.js",
      "expo-router",
      [
        "expo-share-intent",
        {
          iosActivationRules: {
            NSExtensionActivationSupportsWebURLWithMaxCount: 1,
            NSExtensionActivationSupportsWebPageWithMaxCount: 1,
            NSExtensionActivationSupportsImageWithMaxCount: 1,
            NSExtensionActivationSupportsMovieWithMaxCount: 0,
            NSExtensionActivationSupportsText: true,
            NSExtensionActivationSupportsFileWithMaxCount: 10,
            NSExtensionActivationRule:
              'SUBQUERY (extensionItems, $extensionItem, SUBQUERY ($extensionItem.attachments, $attachment, SUBQUERY ($attachment.registeredTypeIdentifiers, $uti, $uti UTI-CONFORMS-TO "com.adobe.pdf" || $uti UTI-CONFORMS-TO "public.image" || $uti UTI-CONFORMS-TO "public.url" || $uti UTI-CONFORMS-TO "public.plain-text").@count >= 1).@count >= 1).@count >= 1',
          },
          androidIntentFilters: ["text/*", "image/*", "application/pdf"],
        },
      ],
      "expo-secure-store",
      [
        "expo-image-picker",
        {
          photosPermission:
            "The app access your photo gallary on your request to hoard them.",
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true,
            targetSdkVersion: 36,
            ndkVersion: "27.1.12297006",
          },
        },
      ],
      "expo-sharing",
      "expo-web-browser",
      // The @sentry/react-native/expo plugin (source map upload during EAS
      // Build) was removed here: it pointed at Karakeep's own Sentry org
      // (localhost-labs-ltd), which this fork has no access to. Sentry.init()
      // in app/_layout.tsx already has an empty dsn, so crash reporting is
      // off by default. To re-enable it, create your own Sentry project and
      // add the plugin back with your org/project, plus a real dsn.
    ],
    extra: {
      router: {
        origin: false,
      },
      // No eas.projectId here on purpose: the upstream value pointed at
      // Karakeep's own Expo project, which this fork can't use. Running
      // `eas init` (or the first `eas build`) will create a new project
      // under your own Expo account and write its id back here.
    },
  },
};
