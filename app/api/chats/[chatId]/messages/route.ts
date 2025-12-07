import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> | { chatId: string } }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

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

    // Получаем chatId из params (поддержка async и sync)
    const resolvedParams = await Promise.resolve(params);
    const chatId = resolvedParams.chatId;

    if (!chatId) {
      return NextResponse.json(
        { error: "ID чата не указан" },
        { status: 400 }
      );
    }

    // Проверяем, что чат принадлежит пользователю
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id, user_id")
      .eq("id", chatId)
      .single();

    if (chatError || !chat || chat.user_id !== user.id) {
      return NextResponse.json(
        { error: "Чат не найден" },
        { status: 404 }
      );
    }

    // Получаем все сообщения чата
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Ошибка при получении сообщений:", error);
      return NextResponse.json(
        { error: "Ошибка при получении сообщений" },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("Ошибка:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> | { chatId: string } }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

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

    // Получаем chatId из params (поддержка async и sync)
    const resolvedParams = await Promise.resolve(params);
    const chatId = resolvedParams.chatId;

    if (!chatId) {
      return NextResponse.json(
        { error: "ID чата не указан" },
        { status: 400 }
      );
    }

    const { content, role } = await request.json();

    if (!content || !role) {
      return NextResponse.json(
        { error: "Отсутствуют обязательные поля: content и role" },
        { status: 400 }
      );
    }

    // Проверяем, что чат принадлежит пользователю
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id, user_id")
      .eq("id", chatId)
      .single();

    if (chatError || !chat || chat.user_id !== user.id) {
      return NextResponse.json(
        { error: "Чат не найден" },
        { status: 404 }
      );
    }

    // Создаем новое сообщение
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        content,
        role,
      })
      .select()
      .single();

    if (error) {
      console.error("Ошибка при создании сообщения:", error);
      return NextResponse.json(
        { error: "Ошибка при создании сообщения" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Ошибка:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
