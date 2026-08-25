const ALLOWED_EXHIBITION_ID = "2026-2-attraction";
const MAX_NICKNAME_LENGTH = 30;
const MAX_MESSAGE_LENGTH = 300;

function sendJson(response, status, payload) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.status(status).json(payload);
}

function getConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  };
}

async function requestSupabase(path, options = {}) {
  const config = getConfig();
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error("Supabase request failed");
    error.status = response.status;
    error.detail = payload;
    throw error;
  }
  return payload;
}

export default async function handler(request, response) {
  const config = getConfig();
  if (!config.url || !config.key) {
    sendJson(response, 200, {
      enabled: false,
      code: "guestbook_not_configured",
      message: "온라인 방명록 기능을 준비하고 있습니다.",
    });
    return;
  }

  if (request.method === "GET") {
    const exhibitionId = String(request.query.exhibitionId || "");
    if (exhibitionId !== ALLOWED_EXHIBITION_ID) {
      sendJson(response, 400, { message: "전시 정보가 올바르지 않습니다." });
      return;
    }
    try {
      const query = new URLSearchParams({
        select: "id,nickname,message,created_at",
        exhibition_id: `eq.${exhibitionId}`,
        order: "created_at.desc",
        limit: "100",
      });
      const entries = await requestSupabase(`exhibition_guestbook?${query}`);
      sendJson(response, 200, { enabled: true, entries });
    } catch {
      sendJson(response, 502, { message: "방명록을 불러오지 못했습니다." });
    }
    return;
  }

  if (request.method === "POST") {
    const exhibitionId = String(request.body?.exhibitionId || "");
    const nickname = String(request.body?.nickname || "").trim();
    const message = String(request.body?.message || "").trim();
    if (exhibitionId !== ALLOWED_EXHIBITION_ID) {
      sendJson(response, 400, { message: "전시 정보가 올바르지 않습니다." });
      return;
    }
    if (!nickname || nickname.length > MAX_NICKNAME_LENGTH) {
      sendJson(response, 400, { message: "이름은 1자 이상 30자 이하로 입력해주세요." });
      return;
    }
    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      sendJson(response, 400, { message: "메시지는 1자 이상 300자 이하로 입력해주세요." });
      return;
    }
    try {
      const entries = await requestSupabase("exhibition_guestbook", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ exhibition_id: exhibitionId, nickname, message }),
      });
      sendJson(response, 201, { entry: entries?.[0] || null });
    } catch {
      sendJson(response, 502, { message: "메시지를 남기지 못했습니다. 잠시 후 다시 시도해주세요." });
    }
    return;
  }

  response.setHeader("Allow", "GET, POST");
  sendJson(response, 405, { message: "지원하지 않는 요청입니다." });
}
