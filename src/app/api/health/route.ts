export async function GET() {
  return Response.json({
    ok: true,
    service: "ai5000-tutor",
    mode: "mvp-shell",
  });
}
