import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { nickname, message, stickerList } = await request.json();

    const data = await resend.emails.send({
      from: 'Doresuru App <onboarding@resend.dev>', // 独自ドメインがない場合はこれを使います
      to: ['miidacnt@gmail.com'],
      subject: `【スタンプ確定】報告：${nickname}さんが40個選びました`,
      text: `先生へ\n\nニックネーム: ${nickname}\n\nメッセージ: ${message}\n\n■選んだスタンプリスト：\n${stickerList}`,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
