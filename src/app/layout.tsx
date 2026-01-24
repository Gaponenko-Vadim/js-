import type { Metadata } from "next";
import "../styles/globals.scss";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { PomodoroProvider } from "@/contexts/PomodoroContext";
import PomodoroWidget from "@/components/pomodoro/PomodoroWidget";
import PomodoroTitleUpdater from "@/components/pomodoro/PomodoroTitleUpdater";

export const metadata: Metadata = {
  title: "Мамин программист",
  description: "Интерактивное приложение для изучения REST API с тестами и таймером Помодоро",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <ReduxProvider>
          <SessionProvider>
            <PomodoroProvider>
              <PomodoroTitleUpdater />
              {children}
              <PomodoroWidget />
            </PomodoroProvider>
          </SessionProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
