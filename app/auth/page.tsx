"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        // Вход
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          router.push("/");
          router.refresh();
        }
      } else {
        // Регистрация
        if (password !== confirmPassword) {
          throw new Error("Пароли не совпадают");
        }

        if (password.length < 6) {
          throw new Error("Пароль должен содержать минимум 6 символов");
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          setMessage("Регистрация успешна! Проверьте вашу почту для подтверждения.");
          setTimeout(() => {
            setIsLogin(true);
            setEmail("");
            setPassword("");
            setConfirmPassword("");
          }, 2000);
        }
      }
    } catch (error: any) {
      setError(error.message || "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-12">
      <div className="w-full max-w-md animate-in fade-in scale-in">
        {/* Логотип/Заголовок */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-4 hover:scale-105 transition-transform">
            <h1 className="bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-3xl sm:text-4xl font-bold text-transparent">
              {process.env.NEXT_PUBLIC_APP_NAME || "AI Assistant"}
            </h1>
          </Link>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
            {isLogin ? "Войдите в свой аккаунт" : "Создайте новый аккаунт"}
          </p>
        </div>

        {/* Форма */}
        <div className="rounded-2xl border border-gray-200/60 bg-white/90 backdrop-blur-lg shadow-2xl dark:border-gray-700/60 dark:bg-gray-800/90 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300/60 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10 dark:border-gray-600/60 dark:bg-gray-700/80 dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:bg-gray-700"
                placeholder="your@email.com"
              />
            </div>

            {/* Пароль */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-gray-300/60 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10 dark:border-gray-600/60 dark:bg-gray-700/80 dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:bg-gray-700"
                placeholder="••••••••"
              />
            </div>

            {/* Подтверждение пароля (только для регистрации) */}
            {!isLogin && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Подтвердите пароль
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-gray-300/60 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10 dark:border-gray-600/60 dark:bg-gray-700/80 dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:bg-gray-700"
                  placeholder="••••••••"
                />
              </div>
            )}

            {/* Сообщения об ошибках и успехе */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-400 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{message}</span>
              </div>
            )}

            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-3.5 text-white font-semibold shadow-lg shadow-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/60 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 dark:from-blue-500 dark:to-indigo-500"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {isLogin ? "Вход..." : "Регистрация..."}
                </span>
              ) : (
                isLogin ? "Войти" : "Зарегистрироваться"
              )}
            </button>
          </form>

          {/* Переключение между входом и регистрацией */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setMessage("");
                  setPassword("");
                  setConfirmPassword("");
                }}
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors underline-offset-2 hover:underline"
              >
                {isLogin ? "Зарегистрироваться" : "Войти"}
              </button>
            </p>
          </div>
        </div>

        {/* Дополнительная информация */}
        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          Продолжая, вы соглашаетесь с нашими условиями использования
        </p>
      </div>
    </div>
  );
}

