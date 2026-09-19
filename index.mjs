// index.mjs — dsh-i18n 插件（Host 側）
//
// 提供 /dsh-i18n RPC：translate({texts, targetLang, provider?, model?, reasoningEffort?})
// → { translations }。用 ctx.llm.stream 做單次批量翻譯，供 client 側「自動翻譯」使用。
// 預設用 agentDefaultModel（用戶主要模型），client 可傳 provider/model 覆寫。

import { BlockAssembler, createUserMessage } from "@deepseek-ai/dsh-llm";

const name = "dsh-i18n";
const inject = ["llm"];
const API_METHOD = "dsh-i18n.translate";

const ok = (value) => ({ ok: true, value });
const failure = (error) => ({
  ok: false,
  error: { code: "internal", message: error instanceof Error ? error.message : String(error), details: {} },
});

function parseTranslations(text, expected) {
  const cleaned = String(text).replace(/```(?:json)?/gi, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const arr = Array.isArray(parsed) ? parsed : parsed.translations;
    if (!Array.isArray(arr)) throw new Error("not an array");
    return arr.slice(0, expected).map((s) => String(s));
  } catch (error) {
    throw new Error("cannot parse translation output: " + (error instanceof Error ? error.message : String(error)));
  }
}

async function translate(ctx, texts, targetLang, route, signal) {
  const messages = [
    createUserMessage({
      content: [{ type: "text", text: JSON.stringify({ texts, targetLang }) }],
      source: { kind: "plugin", plugin: "dsh-i18n" },
    }),
  ];
  const assembler = new BlockAssembler();
  const options = {
    provider: route.provider,
    model: route.model,
    ...(route.reasoningEffort === undefined ? {} : { reasoningEffort: route.reasoningEffort }),
    messages,
    system:
      "You are a professional translator. Translate each string in the JSON input array to " +
      targetLang +
      ". Return ONLY a JSON array of strings, same length and order as input. No commentary, no markdown fences.",
    purpose: "dsh-i18n-translate",
    ...(signal ? { signal } : {}),
  };
  for await (const chunk of ctx.llm.stream(options)) {
    assembler.push(chunk);
  }
  if (assembler.finish && assembler.finish.kind !== "stop") {
    throw new Error("llm finish: " + assembler.finish.kind);
  }
  const text = assembler.blocks().filter((b) => b.type === "text").map((b) => b.text).join("");
  return parseTranslations(text, texts.length);
}

function readEnvelope(body) {
  if (typeof body !== "object" || body === null) return undefined;
  const record = body;
  if (record.type !== "client-request" || typeof record.rpcId !== "string" || typeof record.method !== "string") {
    return undefined;
  }
  return { rpcId: record.rpcId, method: record.method, payload: record.payload };
}

function serverResponse(rpcId, result) {
  return Response.json({ type: "server-response", rpcId, result });
}

function apply(ctx) {
  // Harness 0.1.5-rc.2: connection.rpc.handle uses the connection fiber's
  // webServer, which that plugin no longer injects. Mount an exact /api
  // Fetch route instead (same pattern as dsh-plugin-subscriptions 0.9.2).
  ctx.inject(["connection"], (connectionCtx) => {
    const connection = connectionCtx.get("connection");
    const handler = async (endpoint, payload, signal) => {
      try {
        if (endpoint !== "translate") return failure(new Error("unknown endpoint " + endpoint));
        const { texts, targetLang } = payload || {};
        if (!Array.isArray(texts) || texts.length === 0 || typeof targetLang !== "string") {
          return failure(new Error("invalid translate payload"));
        }
        let route;
        if (payload.provider && payload.model) {
          route = { provider: payload.provider, model: payload.model, reasoningEffort: payload.reasoningEffort };
        } else {
          try {
            route = ctx.get("agentDefaultModel")?.currentSelection?.() ?? null;
          } catch {
            route = null;
          }
        }
        if (!route || !route.provider || !route.model) return failure(new Error("no model route"));
        const translations = await translate(ctx, texts, targetLang, route, signal);
        if (translations.length !== texts.length) return failure(new Error("translation length mismatch"));
        return ok({ translations });
      } catch (error) {
        return failure(error);
      }
    };
    connectionCtx.effect(() => connection.fetch.register({
      path: `/api/${API_METHOD}`,
      methods: ["POST"],
      requestBody: "buffered",
      fetch: async (request) => {
        if (request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() !== "application/json") {
          return new Response("content type must be application/json", { status: 415 });
        }
        let body;
        try {
          body = await request.json();
        } catch {
          return new Response("body is not JSON", { status: 400 });
        }
        const envelope = readEnvelope(body);
        if (envelope === undefined) {
          const rawId = body?.rpcId;
          return serverResponse(typeof rawId === "string" ? rawId : "invalid-request", {
            ok: false,
            error: { code: "gateway/bad-request", message: "invalid client-request message", details: { issues: [] } },
          });
        }
        if (envelope.method !== API_METHOD) {
          return serverResponse(envelope.rpcId, {
            ok: false,
            error: {
              code: "gateway/bad-request",
              message: `method ${JSON.stringify(envelope.method)} does not match endpoint ${JSON.stringify(API_METHOD)}`,
              details: { issues: [] },
            },
          });
        }
        return serverResponse(envelope.rpcId, await handler("translate", envelope.payload, request.signal));
      },
    }), "dsh-i18n: /api/dsh-i18n.translate route");
  });
}

export { apply, inject, name };
