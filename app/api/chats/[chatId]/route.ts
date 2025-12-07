import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function DELETE(
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
      .eq("user_id", user.id)
      .single();

    if (chatError || !chat) {
      return NextResponse.json(
        { error: "Чат не найден" },
        { status: 404 }
      );
    }

    // Удаляем чат (сообщения удалятся автоматически благодаря CASCADE)
    const { error: deleteError } = await supabase
      .from("chats")
      .delete()
      .eq("id", chatId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Ошибка при удалении чата:", deleteError);
      return NextResponse.json(
        { error: "Ошибка при удалении чата", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Чат успешно удален" });
  } catch (error: any) {
    console.error("Ошибка:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера", details: error.message },
      { status: 500 }
    );
  }
}





