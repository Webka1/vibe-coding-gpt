"use client";

import { useState, useEffect, useRef } from "react";
import React from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "../../../lib/supabase";
import { signOut } from "../../../lib/auth";

interface Message {
  id: string;
  text: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

const models: { name: string; id: string }[] = [
  { name: "GPT-5.1", id: "gpt-5.1" },
  { name: "GPT-5", id: "gpt-5" },
  { name: "GPT-5 mini", id: "gpt-5-mini" },
  { name: "GPT-4.1", id: "gpt-4.1" },
  { name: "GPT 4 Turbo", id: "gpt-4-0125-preview" },
  { name: "GPT-4o", id: "gpt-4o" },
  { name: "GPT-4o mini", id: "gpt-4o-mini" },
  { name: "GPT 4", id: "gpt-4" },
  { name: "GPT 3.5 Turbo", id: "gpt-3.5-turbo" },
  { name: "Claude Opus 4.5", id: "claude-opus-4.5" },
  { name: "Claude Sonnet 4", id: "claude-sonnet-4" },
  { name: "Claude Haiku 4.5", id: "claude-haiku-4.5" },
  { name: "Claude Sonnet 4.5", id: "claude-sonnet-4.5" },
  { name: "Grok Code Fast 1", id: "grok-code-fast-1" },
  { name: "Gemini 3 Pro Preview", id: "gemini-3-pro-preview" },
  { name: "Gemini 2.5 Pro", id: "gemini-2.5-pro" },
];

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-5.1");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const chatId = params.id as string;

  // Проверка авторизации
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      setAuthLoading(false);

      if (!user) {
        router.push("/auth");
        return;
      }

      // Загружаем чаты пользователя
      await loadChats();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        router.push("/auth");
        setChats([]);
      } else {
        await loadChats();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const loadMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/chats/${chatId}/messages`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const loadedMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          text: msg.content,
          role: msg.role,
          timestamp: new Date(msg.created_at),
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error("Ошибка при загрузке сообщений:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadChats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch("/api/chats", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats);
      }
    } catch (error) {
      console.error("Ошибка при загрузке чатов:", error);
    }
  };

  const createNewChat = async (initialMessage?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Создаем новый чат
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: initialMessage ? initialMessage.substring(0, 50) + "..." : "Новый чат",
        }),
      });

      if (!response.ok) throw new Error("Ошибка при создании чата");

      const data = await response.json();
      const newChatId = data.chat.id;

      // Если есть начальное сообщение, добавляем его и генерируем ответ
      if (initialMessage) {
        // Сохраняем сообщение пользователя
        await fetch(`/api/chats/${newChatId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            content: initialMessage,
            role: "user",
          }),
        });

        // Генерируем ответ AI
        const aiResponse = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: initialMessage,
            model: selectedModel,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();

          // Сохраняем ответ AI
          await fetch(`/api/chats/${newChatId}/messages`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              content: aiData.message,
              role: "assistant",
            }),
          });
        }
      }

      // Обновляем список чатов и перенаправляем
      await loadChats();
      router.push(`/chat/${newChatId}`);
    } catch (error) {
      console.error("Ошибка при создании чата:", error);
      alert("Ошибка при создании чата");
    }
  };

  const deleteChat = async (chatIdToDelete: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/chats/${chatIdToDelete}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error("Ошибка при удалении чата");

      // Обновляем список чатов
      await loadChats();

      // Если удален текущий чат, перенаправляем на главную
      if (chatIdToDelete === chatId) {
        router.push("/");
      }
    } catch (error) {
      console.error("Ошибка при удалении чата:", error);
      alert("Ошибка при удалении чата");
    }
  };

  // Загрузка сообщений при изменении chatId
  useEffect(() => {
    if (chatId && user) {
      loadMessages();
    }
  }, [chatId, user]);

  // Инициализация
  useEffect(() => {
    const initialMessage = searchParams.get("message");
    const initialResponse = searchParams.get("response");
    const model = searchParams.get("model");

    if (model) {
      setSelectedModel(model);
    }

    // Если есть начальное сообщение, обрабатываем его
    if (initialMessage && !initializedRef.current) {
      initializedRef.current = true;
      // Обработка начального сообщения будет выполнена в handleSubmit
    }
  }, [searchParams]);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveMessage = async (content: string, role: "user" | "assistant") => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content,
          role,
        }),
      });
    } catch (error) {
      console.error("Ошибка при сохранении сообщения:", error);
    }
  };

  const fetchAssistantResponse = async (userMessageText: string, currentMessages: Message[], model?: string) => {
    // Создаем новый AbortController для этого запроса
    const controller = new AbortController();
    setAbortController(controller);
    setIsLoading(true);
    
    try {
      // Сохраняем сообщение пользователя
      await saveMessage(userMessageText, "user");

      // Формируем массив сообщений для отправки в API
      // Используем переданный currentMessages, который уже включает новое сообщение
      const messagesForAPI = currentMessages.map((msg) => ({
        role: msg.role,
        content: msg.text,
      }));

      console.log("Отправка запроса с сообщениями:", messagesForAPI.length, "сообщений");
      console.log("Детали сообщений:", messagesForAPI.map((m, i) => `${i + 1}. ${m.role}: ${m.content.substring(0, 30)}...`));

      // Получаем токен авторизации
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Не удалось получить токен авторизации");
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: messagesForAPI,
          model: model || selectedModel,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Ошибка API:", errorData);
        throw new Error(errorData.error || "Ошибка при получении ответа");
      }

      const data = await response.json();
      
      console.log("Получен ответ от API:", data.message ? `Длина: ${data.message.length} символов` : "Нет сообщения");
      
      if (!data.message) {
        throw new Error("Пустой ответ от API");
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        text: data.message,
        role: "assistant",
        timestamp: new Date(),
      };

      // Сохраняем ответ ассистента
      await saveMessage(data.message, "assistant");

      // Обновляем состояние сообщений, добавляя ответ ассистента
      setMessages((prev) => {
        // Проверяем, что сообщение еще не добавлено
        const exists = prev.some(msg => msg.id === assistantMessage.id);
        if (exists) {
          console.log("Сообщение уже существует, пропускаем");
          return prev;
        }
        const newMessages = [...prev, assistantMessage];
        console.log("Обновлено сообщений в состоянии:", newMessages.length);
        return newMessages;
      });
    } catch (error: any) {
      // Игнорируем ошибку, если запрос был отменен
      if (error.name === 'AbortError') {
        console.log("Генерация остановлена пользователем");
        const stoppedMessage: Message = {
          id: Date.now().toString(),
          text: "Генерация остановлена пользователем",
          role: "assistant" as const,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, stoppedMessage]);
        return;
      }
      
      console.error("Ошибка:", error);
      const errorMessage = {
        id: Date.now().toString(),
        text: "Произошла ошибка при получении ответа. Попробуйте еще раз.",
        role: "assistant" as const,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      await saveMessage(errorMessage.text, "assistant");
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const stopGeneration = () => {
    console.log("stopGeneration вызвана, abortController:", abortController ? "есть" : "нет");
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
      console.log("Генерация остановлена");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inputMessage.trim() && !isLoading) {
      const messageText = inputMessage.trim();
      setInputMessage(""); // Очищаем поле ввода сразу
      
      const userMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        role: "user",
        timestamp: new Date(),
      };
      
      // Обновляем состояние сообщений и сразу используем обновленный массив
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      console.log("Отправка сообщения. Всего сообщений в истории:", updatedMessages.length);
      console.log("Сообщения:", updatedMessages.map(m => ({ role: m.role, text: m.text.substring(0, 50) })));

      // Отправляем запрос к API с обновленным списком сообщений
      await fetchAssistantResponse(messageText, updatedMessages, selectedModel);
    }
  };

  // Показываем индикатор загрузки пока проверяем авторизацию
  if (authLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован, показываем сообщение
  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Требуется авторизация</p>
          <Link
            href="/auth"
            className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-3 text-white font-medium shadow-lg shadow-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/60 hover:scale-105 active:scale-95 dark:from-blue-500 dark:to-indigo-500"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative">
      {/* Мобильное меню overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="fixed left-0 top-0 bottom-0 w-72 z-50 md:hidden bg-white/95 backdrop-blur-lg dark:bg-gray-800/95 border-r border-gray-200/60 dark:border-gray-700/60 shadow-xl animate-in slide-in-from-left">
            {/* Мобильная боковая панель - тот же контент */}
            <div className="p-5 border-b border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 group hover:opacity-80 transition-opacity flex-1"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-6 h-6 text-white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    />
                  </svg>
                </div>
                <h1 className="bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-xl font-bold text-transparent group-hover:from-blue-700 group-hover:via-blue-600 group-hover:to-blue-700 dark:group-hover:from-blue-300 dark:group-hover:via-blue-400 dark:group-hover:to-blue-300 transition-all">
                  {process.env.NEXT_PUBLIC_APP_NAME || "AI Assistant"}
                </h1>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50 ml-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <button
                onClick={() => {
                  createNewChat();
                  setSidebarOpen(false);
                }}
                className="w-full mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200/60 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all dark:border-gray-700/60 dark:from-blue-900/30 dark:to-indigo-900/30 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 active:scale-[0.98] shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="h-5 w-5 text-blue-600 dark:text-blue-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                <span className="font-semibold text-blue-900 dark:text-blue-100">Новый чат</span>
              </button>
              <div className="space-y-1">
                {chats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                    <p>Нет сохраненных чатов</p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <Link
                      key={chat.id}
                      href={`/chat/${chat.id}`}
                      onClick={() => setSidebarOpen(false)}
                      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        chatId === chat.id
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200/60 dark:border-blue-800/60 shadow-sm"
                          : "hover:bg-gray-100/80 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="h-4 w-4 flex-shrink-0"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                        />
                      </svg>
                      <span className="flex-1 truncate text-sm font-medium">
                        {chat.title}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200/60 dark:border-gray-700/60">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {user.email?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate min-w-0">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Боковая панель */}
      {user && (
        <div className="hidden md:flex w-72 lg:w-80 border-r border-gray-200/60 dark:border-gray-700/60 bg-white/90 backdrop-blur-lg dark:bg-gray-800/90 flex-col shadow-sm">
          {/* Логотип */}
          <div className="p-5 border-b border-gray-200/60 dark:border-gray-700/60">
            <Link
              href="/"
              className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-6 h-6 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
              </div>
              <h1 className="bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-xl font-bold text-transparent group-hover:from-blue-700 group-hover:via-blue-600 group-hover:to-blue-700 dark:group-hover:from-blue-300 dark:group-hover:via-blue-400 dark:group-hover:to-blue-300 transition-all">
                {process.env.NEXT_PUBLIC_APP_NAME || "AI Assistant"}
              </h1>
            </Link>
          </div>

          {/* Список чатов */}
          <div className="flex-1 overflow-y-auto p-4">
            <button
              onClick={() => createNewChat()}
              className="w-full mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200/60 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all dark:border-gray-700/60 dark:from-blue-900/30 dark:to-indigo-900/30 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 active:scale-[0.98] shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="h-5 w-5 text-blue-600 dark:text-blue-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              <span className="font-semibold text-blue-900 dark:text-blue-100">Новый чат</span>
            </button>

            <div className="space-y-1">
              {chats.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  <p>Нет сохраненных чатов</p>
                  <p className="text-xs mt-1">Создайте новый чат, чтобы начать</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/chat/${chat.id}`}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      chatId === chat.id
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200/60 dark:border-blue-800/60 shadow-sm"
                        : "hover:bg-gray-100/80 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-4 w-4 flex-shrink-0"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                      />
                    </svg>
                    <span className="flex-1 truncate text-sm font-medium">
                      {chat.title}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm('Вы уверены, что хотите удалить этот чат?')) {
                          deleteChat(chat.id);
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all"
                      title="Удалить чат"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456.0c.654-.867 1.62-1.347 2.542-1.137C21.902 4.923 22.434 6.288 21.902 7.233c-.398.734-1.16 1.081-1.974 1.081Zm-5.23 0a.75.75 0 0 1 .75-.75h2.69c.654 0 1.187-.572 1.12-1.226-.049-.605-.604-1.074-1.208-1.074h-2.69a.75.75 0 0 1-.75-.75Z"
                        />
                      </svg>
                    </button>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Профиль пользователя */}
          <div className="p-4 border-t border-gray-200/60 dark:border-gray-700/60">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {user.email?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate min-w-0">
                  {user.email}
                </span>
              </div>
              <button
                onClick={async () => {
                  try {
                    await signOut();
                    router.push("/auth");
                    router.refresh();
                  } catch (error) {
                    console.error("Ошибка при выходе:", error);
                  }
                }}
                className="p-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-colors flex-shrink-0"
                title="Выйти"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Основная область */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {/* Мобильная кнопка меню */}
        {user && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-xl bg-white/80 backdrop-blur-md dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all"
            title="Меню"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5 text-gray-600 dark:text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        )}

        {/* Выбор модели вверху области сообщений */}
        <div className="px-4 sm:px-6 pt-6 pb-4">
          <div className="mx-auto max-w-4xl flex items-center justify-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="group flex items-center gap-2 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm transition-all hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md active:scale-95"
              >
                <span className="hidden sm:inline">Модель: </span>
                <span>{models.find(m => m.id === selectedModel)?.name || selectedModel}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className={`h-4 w-4 transition-transform ${isModelDropdownOpen ? "rotate-180" : ""}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>
              
              {isModelDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsModelDropdownOpen(false)}
                  ></div>
                  <div className="absolute left-1/2 z-20 mt-2 max-h-96 w-72 -translate-x-1/2 overflow-y-auto rounded-xl border border-gray-200/60 bg-white/95 backdrop-blur-md shadow-2xl dark:border-gray-700/60 dark:bg-gray-800/95 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                      {models.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            setSelectedModel(model.id);
                            setIsModelDropdownOpen(false);
                          }}
                          className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                            selectedModel === model.id
                              ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 shadow-sm dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-100"
                              : "text-gray-700 hover:bg-gray-50/80 dark:text-gray-300 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {model.id}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Область сообщений */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 sm:py-6">
            {loadingMessages ? (
              <div className="flex h-full items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400"></div>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">Загрузка сообщений...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-12 w-12 text-gray-400 dark:text-gray-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-2.04 1.057-2.04 2.19v4.286c0 .647.492 1.19 1.207 1.293.815.097 1.64.156 2.48.156.815 0 1.605-.051 2.38-.156.815-.097 1.207-.646 1.207-1.293V12.33c0-.698.508-1.245 1.207-1.348.815-.097 1.64-.156 2.48-.156.84 0 1.665.059 2.48.156.699.103 1.207.65 1.207 1.348v4.286c0 .698-.508 1.245-1.207 1.348a38.033 38.033 0 0 1-2.48.156c-.84 0-1.665-.059-2.48-.156-.815-.097-1.207-.646-1.207-1.293V12.33c0-.698.508-1.245 1.207-1.348.815-.097 1.64-.156 2.48-.156.84 0 1.665.059 2.48.156C21.057 11.085 21.549 11.628 21.549 12.33v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m-3.12-8.538a1.525 1.525 0 0 0-.287-.336c-.287-.226-.69-.393-1.093-.393a1.595 1.595 0 0 0-.808.244.6.6 0 0 1-.834-.654c.007-.111.02-.222.037-.331a2.52 2.52 0 0 0-.512-1.658c-.225-.349-.468-.656-.718-.909a2.52 2.52 0 0 1-.792-1.843c0-.77.249-1.45.708-1.954.467-.51 1.117-.81 1.863-.81 1.025 0 1.862.616 2.29 1.514.435.9.435 1.99 0 2.89-.435.9-1.27 1.516-2.295 1.516-.74 0-1.388-.282-1.868-.834a.17.17 0 0 0-.152-.064c-.107.042-.22.096-.33.158-.122.074-.231.173-.32.292a2.525 2.525 0 0 0-.444.832c-.089.251-.146.52-.164.797-.008.126-.004.252.012.378a.75.75 0 0 1-.059.445c-.043.108-.11.218-.196.325a1.525 1.525 0 0 0-.287.336c-.287.226-.69.393-1.093.393a1.595 1.595 0 0 0-.808.244.6.6 0 0 1-.834-.654c.007-.111.02-.222.037-.331a2.52 2.52 0 0 0-.512-1.658c-.225-.349-.468-.656-.718-.909a2.52 2.52 0 0 1-.792-1.843c0-.77.249-1.45.708-1.954.467-.51 1.117-.81 1.863-.81 1.025 0 1.862.616 2.29 1.514.435.9.435 1.99 0 2.89-.435.9-1.27 1.516-2.295 1.516-.74 0-1.388-.282-1.868-.834a.17.17 0 0 0-.152-.064c-.107.042-.22.096-.33.158-.122.074-.231.173-.32.292a2.525 2.525 0 0 0-.444.832c-.089.251-.146.52-.164.797-.008.126-.004.252.012.378a.75.75 0 0 1-.059.445c-.043.108-.11.218-.196.325z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Начните диалог
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    Отправьте сообщение, чтобы начать разговор с ИИ
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-8">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-5 h-5 text-white"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                          />
                        </svg>
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl px-5 py-4 shadow-sm ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md"
                          : "bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200/60 dark:border-gray-700/60"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="markdown-content prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                          {message.text}
                        </p>
                      )}
                      <div
                        className={`mt-2 text-xs opacity-70 ${
                          message.role === "user" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    {message.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-5 h-5 text-white"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4 justify-start animate-in fade-in">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5 text-white"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                        />
                      </svg>
                    </div>
                    <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl rounded-bl-md px-5 py-4 border border-gray-200/60 dark:border-gray-700/60 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Форма ввода */}
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <div className="mx-auto max-w-4xl relative">
            <form 
              onSubmit={handleSubmit} 
              className="w-full"
            >
              <div
                className={`group relative rounded-2xl border-2 bg-transparent backdrop-blur-sm transition-all duration-300 ${
                  isFocused
                    ? "border-blue-400 dark:border-blue-500 shadow-xl shadow-blue-500/10 dark:shadow-blue-500/20"
                    : "border-gray-200/60 dark:border-gray-700/60 shadow-lg hover:shadow-xl hover:border-gray-300/60 dark:hover:border-gray-600/60"
                }`}
              >
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (inputMessage.trim() && !isLoading) {
                        handleSubmit(e as any);
                      }
                    }
                  }}
                  placeholder="Введите ваше сообщение..."
                  rows={1}
                  className="w-full resize-none rounded-2xl bg-transparent px-5 py-4 pr-14 text-base text-gray-900 placeholder-gray-400 outline-none transition-colors dark:text-white dark:placeholder-gray-500"
                  style={{
                    minHeight: "56px",
                    maxHeight: "200px",
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                  }}
                />
                {!isLoading && (
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className={`absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
                      inputMessage.trim()
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60 hover:scale-105 active:scale-95 dark:from-blue-500 dark:to-indigo-500"
                        : "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </form>
            {isLoading && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Клик по кнопке остановки");
                  stopGeneration();
                }}
                className="absolute bottom-9 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/60 hover:scale-105 active:scale-95 transition-all duration-200 z-20"
                title="Остановить генерацию"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
