// index.mjs — dsh-i18n 插件（Host 側）
//
// 提供 /dsh-i18n RPC：translate({texts, targetLang, provider?, model?, reasoningEffort?})
// → { translations }。用 ctx.llm.stream 做單次批量翻譯，供 client 側「沉浸式翻譯」使用。
// 預設用 agentDefaultModel（用戶主要模型），client 可傳 provider/model 覆寫。

import { BlockAssembler, createUserMessage } from "@deepseek-ai/dsh-llm";

const name = "dsh-i18n";
const inject = ["llm"];
const CHANNEL = "/dsh-i18n";

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

function apply(ctx) {
  ctx.inject(["connection"], (connectionCtx) => {
    const connection = connectionCtx.get("connection");
    connectionCtx.effect(() => connection.rpc.handle(CHANNEL, async (endpoint, payload, signal) => {
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
    }, { authority: "loopback" }), "dsh-i18n: /dsh-i18n rpc channel");
  });
}

export { apply, inject, name };
