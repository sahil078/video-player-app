export default {
  expo: {
    name: "Video Player with ASS Subtitles",
    slug: "video-player-native",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        }
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000"
      },
      permissions: [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      [
        "expo-av",
        {
          microphonePermission: false,
          cameraPermission: false
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "your-project-id"
      }
    },
    // Disable authentication requirements
    owner: "anonymous",
    // Enable offline development
    developmentClient: {
      silentLaunch: true
    }
  }
}; 