"use client";

import { ChatProvider } from "./context/ChatContext";
import MainPage from "./MainPage";

export default function Page() {
  return (
    <ChatProvider>
      <MainPage />
    </ChatProvider>
  );
}