import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TRPCProvider } from "./utils/trpc";

import { HomeScreen } from "./screens/home";
import { SessionProvider } from "next-auth/expo";

export const App = () => {
  return (
    <TRPCProvider>
      <SafeAreaProvider>
        <SessionProvider>
          <HomeScreen />
          <StatusBar />
        </SessionProvider>
      </SafeAreaProvider>
    </TRPCProvider>
  );
};
