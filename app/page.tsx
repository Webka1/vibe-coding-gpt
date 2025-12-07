"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

interface Model {
  name: string;
  id: string;
  provider: string;
  description: string;
  capabilities: string[];
  bestFor: string;
  speed: "fast" | "medium" | "slow";
  intelligence: "high" | "medium" | "low";
}

const models: Model[] = [
  { 
    name: "GPT-5.1", 
    id: "gpt-5.1",
    provider: "OpenAI",
    description: "Самая продвинутая модель OpenAI с улучшенными возможностями рассуждения и понимания контекста.",
    capabilities: ["Сложные рассуждения", "Код", "Анализ данных", "Творчество"],
    bestFor: "Сложные задачи, требующие глубокого понимания",
    speed: "medium",
    intelligence: "high"
  },
  { 
    name: "GPT-5", 
    id: "gpt-5",
    provider: "OpenAI",
    description: "Мощная модель нового поколения с расширенными возможностями.",
    capabilities: ["Многоязычность", "Код", "Анализ", "Творчество"],
    bestFor: "Универсальные задачи",
    speed: "medium",
    intelligence: "high"
  },
  { 
    name: "GPT-5 mini", 
    id: "gpt-5-mini",
    provider: "OpenAI",
    description: "Быстрая и эффективная версия GPT-5 для повседневных задач.",
    capabilities: ["Быстрые ответы", "Простой код", "Общие вопросы"],
    bestFor: "Быстрые ответы и простые задачи",
    speed: "fast",
    intelligence: "medium"
  },
  { 
    name: "GPT-4.1", 
    id: "gpt-4.1",
    provider: "OpenAI",
    description: "Улучшенная версия GPT-4 с лучшей производительностью.",
    capabilities: ["Анализ", "Код", "Творчество", "Переводы"],
    bestFor: "Профессиональные задачи",
    speed: "medium",
    intelligence: "high"
  },
  { 
    name: "GPT 4 Turbo", 
    id: "gpt-4-0125-preview",
    provider: "OpenAI",
    description: "Оптимизированная версия GPT-4 с увеличенным контекстом и скоростью.",
    capabilities: ["Длинный контекст", "Быстрая обработка", "Код", "Анализ"],
    bestFor: "Работа с большими документами",
    speed: "fast",
    intelligence: "high"
  },
  { 
    name: "GPT-4o", 
    id: "gpt-4o",
    provider: "OpenAI",
    description: "Мультимодальная модель с оптимизированной производительностью.",
    capabilities: ["Мультимодальность", "Быстрые ответы", "Код", "Анализ"],
    bestFor: "Быстрые и точные ответы",
    speed: "fast",
    intelligence: "high"
  },
  { 
    name: "GPT-4o mini", 
    id: "gpt-4o-mini",
    provider: "OpenAI",
    description: "Компактная версия GPT-4o для быстрых ответов.",
    capabilities: ["Быстрые ответы", "Простой анализ", "Общие вопросы"],
    bestFor: "Повседневные задачи",
    speed: "fast",
    intelligence: "medium"
  },
  { 
    name: "GPT 4", 
    id: "gpt-4",
    provider: "OpenAI",
    description: "Классическая модель GPT-4 с проверенной надежностью.",
    capabilities: ["Анализ", "Код", "Творчество", "Обучение"],
    bestFor: "Надежные результаты",
    speed: "medium",
    intelligence: "high"
  },
  { 
    name: "GPT 3.5 Turbo", 
    id: "gpt-3.5-turbo",
    provider: "OpenAI",
    description: "Быстрая и экономичная модель для большинства задач.",
    capabilities: ["Быстрые ответы", "Общие вопросы", "Простой код"],
    bestFor: "Бюджетные задачи",
    speed: "fast",
    intelligence: "medium"
  },
  { 
    name: "Claude Opus 4.5", 
    id: "claude-opus-4.5",
    provider: "Anthropic",
    description: "Самая мощная модель Anthropic с превосходными возможностями рассуждения.",
    capabilities: ["Глубокий анализ", "Этика", "Длинный контекст", "Творчество"],
    bestFor: "Сложные аналитические задачи",
    speed: "slow",
    intelligence: "high"
  },
  { 
    name: "Claude Sonnet 4", 
    id: "claude-sonnet-4",
    provider: "Anthropic",
    description: "Сбалансированная модель с отличным соотношением качества и скорости.",
    capabilities: ["Анализ", "Код", "Творчество", "Переводы"],
    bestFor: "Универсальные задачи",
    speed: "medium",
    intelligence: "high"
  },
  { 
    name: "Claude Haiku 4.5", 
    id: "claude-haiku-4.5",
    provider: "Anthropic",
    description: "Самая быстрая модель Anthropic для мгновенных ответов.",
    capabilities: ["Быстрые ответы", "Простой анализ", "Общие вопросы"],
    bestFor: "Мгновенные ответы",
    speed: "fast",
    intelligence: "medium"
  },
  { 
    name: "Claude Sonnet 4.5", 
    id: "claude-sonnet-4.5",
    provider: "Anthropic",
    description: "Улучшенная версия Sonnet с расширенными возможностями.",
    capabilities: ["Анализ", "Код", "Творчество", "Длинный контекст"],
    bestFor: "Профессиональные задачи",
    speed: "medium",
    intelligence: "high"
  },
  { 
    name: "Grok Code Fast 1", 
    id: "grok-code-fast-1",
    provider: "xAI",
    description: "Специализированная модель для быстрой генерации и анализа кода.",
    capabilities: ["Генерация кода", "Отладка", "Оптимизация", "Быстрые ответы"],
    bestFor: "Программирование и разработка",
    speed: "fast",
    intelligence: "high"
  },
  { 
    name: "Gemini 3 Pro Preview", 
    id: "gemini-3-pro-preview",
    provider: "Google",
    description: "Предварительная версия следующего поколения Gemini с улучшенными возможностями.",
    capabilities: ["Мультимодальность", "Анализ", "Код", "Творчество"],
    bestFor: "Инновационные задачи",
    speed: "medium",
    intelligence: "high"
  },
  { 
    name: "Gemini 2.5 Pro", 
    id: "gemini-2.5-pro",
    provider: "Google",
    description: "Мощная мультимодальная модель от Google.",
    capabilities: ["Мультимодальность", "Анализ", "Код", "Поиск"],
    bestFor: "Работа с различными типами данных",
    speed: "medium",
    intelligence: "high"
  },
];

export default function Home() {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-5.1");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const router = useRouter();

  // Фильтрация моделей по поисковому запросу
  const filteredModels = models.filter((model) => {
    const query = modelSearchQuery.toLowerCase();
    return (
      model.name.toLowerCase().includes(query) ||
      model.provider.toLowerCase().includes(query) ||
      model.description.toLowerCase().includes(query) ||
      model.capabilities.some((cap) => cap.toLowerCase().includes(query)) ||
      model.bestFor.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    // Проверяем текущего пользователя
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        await loadChats();
      }
    });

    // Слушаем изменения авторизации
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadChats();
      } else {
        setChats([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.refresh();
    } catch (error) {
      console.error("Ошибка при выходе:", error);
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
      if (!session?.access_token) {
        console.error("Нет токена авторизации");
        return;
      }

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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Ошибка при создании чата");
      }

      const data = await response.json();
      const chatId = data.chat?.id;

      if (!chatId) {
        throw new Error("Не удалось получить ID созданного чата");
      }

      // Если есть начальное сообщение, добавляем его и генерируем ответ
      if (initialMessage) {
        // Сохраняем сообщение пользователя
        const userMessageResponse = await fetch(`/api/chats/${chatId}/messages`, {
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

        if (!userMessageResponse.ok) {
          const errorData = await userMessageResponse.json().catch(() => ({}));
          console.error("Ошибка при сохранении сообщения пользователя:", errorData);
          throw new Error(errorData.error || "Ошибка при сохранении сообщения");
        }

        // Генерируем ответ AI
        const controller = new AbortController();
        setAbortController(controller);
        
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
          signal: controller.signal,
        });

        if (!aiResponse.ok) {
          const errorData = await aiResponse.json().catch(() => ({}));
          // Проверяем, не была ли ошибка из-за отмены запроса
          if (errorData.error?.includes?.('aborted') || controller.signal.aborted) {
            console.log("Генерация остановлена пользователем");
            setAbortController(null);
            setIsLoading(false);
            return; // Прерываем создание чата, если генерация была остановлена
          }
          console.error("Ошибка при получении ответа AI:", errorData);
          // Не прерываем процесс, просто не сохраняем ответ AI
        } else {
          const aiData = await aiResponse.json();

          if (aiData.message) {
            // Сохраняем ответ AI
            const assistantMessageResponse = await fetch(`/api/chats/${chatId}/messages`, {
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

            if (!assistantMessageResponse.ok) {
              const errorData = await assistantMessageResponse.json().catch(() => ({}));
              console.error("Ошибка при сохранении ответа AI:", errorData);
              // Не прерываем процесс, ответ AI не сохранится, но чат создан
            }
          }
        }
      }

      // Обновляем список чатов
      await loadChats();

      // Сбрасываем состояние загрузки и AbortController перед редиректом
      setIsLoading(false);
      setAbortController(null);

      // Небольшая задержка для синхронизации данных
      await new Promise(resolve => setTimeout(resolve, 300));

      // Перенаправляем на страницу чата
      router.push(`/chat/${chatId}`);
    } catch (error: any) {
      // Проверяем, не была ли ошибка из-за отмены запроса
      if (error.name === 'AbortError' || error.message?.includes?.('aborted')) {
        console.log("Генерация остановлена пользователем");
        setIsLoading(false);
        setAbortController(null);
        return; // Не показываем ошибку, если генерация была остановлена
      }
      
      console.error("Ошибка при создании чата:", error);
      setIsLoading(false);
      setAbortController(null);
      alert(error.message || "Ошибка при создании чата. Попробуйте еще раз.");
    }
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert("Требуется авторизация");
        return;
      }

      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Ошибка при удалении чата");
      }

      // Оптимистично обновляем список чатов (удаляем из состояния сразу)
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));

      // Затем загружаем актуальный список с сервера
      await loadChats();

      // Если удален текущий чат, перенаправляем на главную
      if (window.location.pathname === `/chat/${chatId}`) {
        router.push("/");
      }
    } catch (error: any) {
      console.error("Ошибка при удалении чата:", error);
      alert(error.message || "Ошибка при удалении чата. Попробуйте еще раз.");
      // Перезагружаем список чатов в случае ошибки
      await loadChats();
    }
  };

  const examplePrompts = [
    "Объясни квантовую физику простыми словами",
    "Напиши код для сортировки массива",
    "Расскажи интересный факт о космосе",
    "Помоги составить план обучения",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Проверяем авторизацию
    if (!user) {
      router.push("/auth");
      return;
    }

    if (message.trim() && !isLoading) {
      setIsLoading(true);
      try {
        await createNewChat(message.trim());
        setMessage(""); // Очищаем поле ввода после успешной отправки
      } catch (error: any) {
        console.error("Ошибка:", error);
        alert(error.message || "Произошла ошибка при отправке сообщения. Попробуйте еще раз.");
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative">
      {/* Мобильное меню overlay */}
      {sidebarOpen && user && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="fixed left-0 top-0 bottom-0 w-72 z-50 md:hidden bg-white/95 backdrop-blur-lg dark:bg-gray-800/95 border-r border-gray-200/60 dark:border-gray-700/60 shadow-xl animate-in slide-in-from-left">
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
                    <div key={chat.id} className="group relative">
                      <Link
                        href={`/chat/${chat.id}`}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-100/80 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors truncate pr-8"
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
                        <span className="flex-1 truncate font-medium">{chat.title}</span>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (confirm('Вы уверены, что хотите удалить этот чат?')) {
                            deleteChat(chat.id);
                            setSidebarOpen(false);
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
                    </div>
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
                <button
                  onClick={handleSignOut}
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
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
                  <div key={chat.id} className="group relative">
                    <Link
                      href={`/chat/${chat.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-100/80 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors truncate pr-8"
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
                      <span className="flex-1 truncate font-medium">{chat.title}</span>
                    </Link>
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
                  </div>
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
                onClick={handleSignOut}
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
      <div className="flex-1 flex flex-col overflow-y-auto">
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
        <main className="flex w-full max-w-6xl mx-auto flex-col px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero секция */}
        <div className="mb-12 sm:mb-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="mb-4 sm:mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent leading-tight">
            {user ? "Как я могу вам помочь?" : `Добро пожаловать в ${process.env.NEXT_PUBLIC_APP_NAME || "AI Assistant"}`}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-base sm:text-lg max-w-2xl mx-auto">
            {user 
              ? "Выберите модель AI и начните диалог. У нас доступно более 15 передовых моделей для любых задач."
              : "Мощная платформа для работы с искусственным интеллектом. Войдите, чтобы начать."
            }
          </p>

          {user && (
            <div className="relative inline-block mt-4">
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="group flex items-center gap-2 rounded-xl border border-gray-200/60 bg-white/80 backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-white hover:shadow-md dark:border-gray-700/60 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800 active:scale-95"
              >
                <span className="hidden sm:inline">Модель: </span>
                <span>{models.find(m => m.id === selectedModel)?.name}</span>
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
                  <div className="absolute left-1/2 z-20 mt-2 max-h-96 w-80 -translate-x-1/2 overflow-y-auto rounded-xl border border-gray-200/60 bg-white/95 backdrop-blur-md shadow-2xl dark:border-gray-700/60 dark:bg-gray-800/95 animate-in fade-in slide-in-from-top-2 duration-200">
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
                            {model.provider} • {model.id}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {user && (
          <>
            {/* Форма для нового диалога */}
            <div className="mb-12">
              <form
                onSubmit={handleSubmit}
                className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150"
              >
          <div
            className={`group relative mb-8 rounded-2xl border-2 bg-transparent backdrop-blur-sm transition-all duration-300 ${
              isFocused
                ? "border-blue-400 dark:border-blue-500 shadow-xl shadow-blue-500/10 dark:shadow-blue-500/20"
                : "border-gray-200/60 dark:border-gray-700/60 shadow-lg hover:shadow-xl hover:border-gray-300/60 dark:hover:border-gray-600/60"
            }`}
          >
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (message.trim() && !isLoading) {
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
            {isLoading ? (
              <button
                type="button"
                onClick={stopGeneration}
                className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/60 hover:scale-105 active:scale-95 transition-all duration-200"
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
            ) : (
              <button
                type="submit"
                disabled={!message.trim()}
                className={`absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
                  message.trim()
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
            </div>

            {/* Примеры запросов */}
            <div className="mb-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <h2 className="mb-4 text-center text-xl font-bold text-gray-900 dark:text-gray-100">
                Примеры запросов
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {examplePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setMessage(prompt)}
                    className="group rounded-xl border border-gray-200/60 bg-white/80 backdrop-blur-sm px-4 py-3.5 text-left text-sm text-gray-700 shadow-sm transition-all duration-200 hover:border-blue-300/60 hover:bg-gradient-to-br hover:from-blue-50/80 hover:to-indigo-50/80 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] dark:border-gray-700/60 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:border-blue-600/40 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20"
                  >
                    <div className="flex items-start gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                      <span>{prompt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Информация о моделях */}
            <div className="mb-12 w-full">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Доступные модели AI
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Выберите подходящую модель для вашей задачи. Каждая модель имеет свои особенности и сильные стороны.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {models.slice(0, 6).map((model) => (
                  <div
                    key={model.id}
                    className={`group rounded-xl border-2 p-5 transition-all duration-200 hover:shadow-lg ${
                      selectedModel === model.id
                        ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-md"
                        : "border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 hover:border-blue-300/60 dark:hover:border-gray-600/60"
                    }`}
                    onClick={() => setSelectedModel(model.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">
                          {model.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {model.provider}
                        </p>
                      </div>
                      {selectedModel === model.id && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={3}
                            stroke="currentColor"
                            className="w-3 h-3 text-white"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {model.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {model.capabilities.slice(0, 3).map((cap, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        Лучше для: {model.bestFor}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded ${
                          model.speed === "fast" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                          model.speed === "medium" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                          "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}>
                          {model.speed === "fast" ? "⚡ Быстро" : model.speed === "medium" ? "⚡ Средне" : "⚡ Медленно"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => setIsModelModalOpen(true)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm transition-colors"
                >
                  Показать все {models.length} моделей →
                </button>
              </div>
            </div>

            {/* Модальное окно выбора модели */}
            {isModelModalOpen && (
              <>
                <div
                  className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                  onClick={() => {
                    setIsModelModalOpen(false);
                    setModelSearchQuery("");
                  }}
                ></div>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div
                    className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in scale-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Заголовок модального окна */}
                    <div className="p-6 border-b border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          Выберите модель AI
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Доступно {models.length} моделей от различных провайдеров
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setIsModelModalOpen(false);
                          setModelSearchQuery("");
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-colors"
                        title="Закрыть"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-5 h-5 text-gray-500 dark:text-gray-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Поиск по моделям */}
                    <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/60">
                      <div className="relative">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                          />
                        </svg>
                        <input
                          type="text"
                          placeholder="Поиск модели..."
                          value={modelSearchQuery}
                          onChange={(e) => setModelSearchQuery(e.target.value)}
                          className="w-full rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-700/80 pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        {modelSearchQuery && (
                          <button
                            onClick={() => setModelSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-4 h-4 text-gray-400"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                      {modelSearchQuery && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Найдено: {filteredModels.length} из {models.length} моделей
                        </p>
                      )}
                    </div>

                    {/* Список моделей */}
                    <div className="flex-1 overflow-y-auto p-4">
                      {filteredModels.length === 0 ? (
                        <div className="text-center py-12">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                            />
                          </svg>
                          <p className="text-gray-500 dark:text-gray-400">
                            Модели не найдены
                          </p>
                          <button
                            onClick={() => setModelSearchQuery("")}
                            className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                          >
                            Очистить поиск
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredModels.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model.id);
                              setIsModelModalOpen(false);
                              setModelSearchQuery("");
                            }}
                            className={`group rounded-xl border-2 p-5 text-left transition-all duration-200 hover:shadow-lg ${
                              selectedModel === model.id
                                ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-md"
                                : "border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 hover:border-blue-300/60 dark:hover:border-gray-600/60"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                    {model.name}
                                  </h3>
                                  {selectedModel === model.id && (
                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={3}
                                        stroke="currentColor"
                                        className="w-3 h-3 text-white"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M4.5 12.75l6 6 9-13.5"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                  {model.provider}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {model.description}
                            </p>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {model.capabilities.slice(0, 3).map((cap, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                >
                                  {cap}
                                </span>
                              ))}
                              {model.capabilities.length > 3 && (
                                <span className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                  +{model.capabilities.length - 3}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500 dark:text-gray-400 line-clamp-1">
                                {model.bestFor}
                              </span>
                              <span className={`px-2 py-0.5 rounded ${
                                model.speed === "fast" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                                model.speed === "medium" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                                "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                              }`}>
                                {model.speed === "fast" ? "⚡ Быстро" : model.speed === "medium" ? "⚡ Средне" : "⚡ Медленно"}
                              </span>
                            </div>
                          </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Футер модального окна */}
                    <div className="p-4 border-t border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/50">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Выбрано: <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {models.find(m => m.id === selectedModel)?.name}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setIsModelModalOpen(false);
                            setModelSearchQuery("");
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-medium shadow-lg shadow-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/60 hover:scale-105 active:scale-95 dark:from-blue-500 dark:to-indigo-500"
                        >
                          Готово
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Возможности приложения */}
            <div className="mb-12 w-full">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Возможности платформы
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Все инструменты, необходимые для продуктивной работы с AI
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    icon: "💬",
                    title: "Умные диалоги",
                    description: "Ведите естественные беседы с AI моделями с сохранением контекста"
                  },
                  {
                    icon: "📝",
                    title: "История чатов",
                    description: "Все ваши диалоги сохраняются и доступны в любое время"
                  },
                  {
                    icon: "🎯",
                    title: "Выбор модели",
                    description: "Более 15 моделей AI на выбор для оптимального решения задач"
                  },
                  {
                    icon: "⚡",
                    title: "Быстрые ответы",
                    description: "Мгновенные ответы от оптимизированных моделей"
                  },
                  {
                    icon: "🔒",
                    title: "Безопасность",
                    description: "Ваши данные защищены и хранятся в безопасности"
                  },
                  {
                    icon: "📱",
                    title: "Адаптивный дизайн",
                    description: "Работайте на любом устройстве с удобным интерфейсом"
                  }
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div className="text-4xl mb-3">{feature.icon}</div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Подсказка */}
            <div className="w-full text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 animate-in fade-in duration-700 delay-500">
                ⚠️ Модели AI могут допускать ошибки. Всегда проверяйте важную информацию.
              </p>
            </div>
          </>
        )}

        {!user && (
          <>
            <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <Link
                href="/auth"
                className="inline-block rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-8 py-4 text-white font-semibold shadow-lg shadow-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/60 hover:scale-105 active:scale-95 dark:from-blue-500 dark:to-indigo-500 text-lg"
              >
                Начать работу
              </Link>
            </div>

            {/* Информация о моделях для неавторизованных */}
            <div className="mb-12 w-full">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Доступные модели AI
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Более 15 передовых моделей от ведущих провайдеров: OpenAI, Anthropic, Google и xAI
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {models.slice(0, 6).map((model) => (
                  <div
                    key={model.id}
                    className="group rounded-xl border-2 border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 p-5 hover:shadow-lg transition-all duration-200 hover:border-blue-300/60 dark:hover:border-gray-600/60"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">
                          {model.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {model.provider}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {model.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {model.capabilities.slice(0, 3).map((cap, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        Лучше для: {model.bestFor}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded ${
                          model.speed === "fast" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                          model.speed === "medium" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                          "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}>
                          {model.speed === "fast" ? "⚡ Быстро" : model.speed === "medium" ? "⚡ Средне" : "⚡ Медленно"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Возможности приложения */}
            <div className="mb-12 w-full">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Возможности платформы
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Все инструменты, необходимые для продуктивной работы с AI
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    icon: "💬",
                    title: "Умные диалоги",
                    description: "Ведите естественные беседы с AI моделями с сохранением контекста"
                  },
                  {
                    icon: "📝",
                    title: "История чатов",
                    description: "Все ваши диалоги сохраняются и доступны в любое время"
                  },
                  {
                    icon: "🎯",
                    title: "Выбор модели",
                    description: "Более 15 моделей AI на выбор для оптимального решения задач"
                  },
                  {
                    icon: "⚡",
                    title: "Быстрые ответы",
                    description: "Мгновенные ответы от оптимизированных моделей"
                  },
                  {
                    icon: "🔒",
                    title: "Безопасность",
                    description: "Ваши данные защищены и хранятся в безопасности"
                  },
                  {
                    icon: "📱",
                    title: "Адаптивный дизайн",
                    description: "Работайте на любом устройстве с удобным интерфейсом"
                  }
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div className="text-4xl mb-3">{feature.icon}</div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Призыв к действию */}
            <div className="w-full text-center mb-12">
              <div className="rounded-2xl border-2 border-blue-200/60 dark:border-blue-800/60 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Готовы начать?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xl mx-auto">
                  Зарегистрируйтесь бесплатно и получите доступ ко всем возможностям платформы
                </p>
                <Link
                  href="/auth"
                  className="inline-block rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-8 py-3 text-white font-semibold shadow-lg shadow-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/60 hover:scale-105 active:scale-95 dark:from-blue-500 dark:to-indigo-500"
                >
                  Создать аккаунт
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
      </div>
    </div>
  );
}
