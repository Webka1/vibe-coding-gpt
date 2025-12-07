import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Убираем "Bearer "

    // Создаем клиент с токеном пользователя
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Получаем пользователя
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Неверный токен авторизации" },
        { status: 401 }
      );
    }

    const { message, messages, model } = await request.json();

    if (!message && (!messages || messages.length === 0)) {
      return NextResponse.json(
        { error: "Сообщение не предоставлено" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const apiEndpoint = process.env.OPENAI_API_ENDPOINT;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API ключ не настроен" },
        { status: 500 }
      );
    }

    // Инициализация OpenAI клиента с кастомным endpoint
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: apiEndpoint || "https://api.openai.com/v1",
    });

    // Формируем массив сообщений для чата
    const chatMessages = messages || [
      {
        role: "user" as const,
        content: message,
      },
    ];

    // Отправляем запрос к OpenAI API
    const completion = await openai.chat.completions.create({
      model: model || "gpt-5.1", // Используем переданную модель или значение по умолчанию
      messages: chatMessages,
      temperature: 0.7,
    });

    const assistantMessage = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      message: assistantMessage,
    });
  } catch (error) {
    console.error("Ошибка при запросе к OpenAI:", error);
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    return NextResponse.json(
      {
        error: "Ошибка при обработке запроса",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

