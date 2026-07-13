import { createAnonymousChild } from "@/lib/auth/anonymous";

export async function POST(request: Request) {
  try {
    const data = await createAnonymousChild(await request.json());

    return Response.json({ ok: true, data });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "匿名登录失败",
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    );
  }
}
