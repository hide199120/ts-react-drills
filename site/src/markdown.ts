import { Marked, type Tokens } from "marked";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import xml from "highlight.js/lib/languages/xml";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);
hljs.registerAliases(["ts", "tsx"], { languageName: "typescript" });
hljs.registerAliases(["js", "jsx"], { languageName: "javascript" });
hljs.registerAliases(["html"], { languageName: "xml" });
hljs.registerAliases(["sh", "shell"], { languageName: "bash" });

export function highlight(code: string, lang = "typescript"): string {
  const language = hljs.getLanguage(lang) ? lang : "typescript";
  return hljs.highlight(code, { language }).value;
}

export interface Heading {
  id: string;
  text: string;
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * CommonMark の仕様では「**強調**（」のように全角の括弧や句読点に隣接した ** が強調にならない。
 * 日本語の文章で困るので、コードブロックとインラインコードの外にある **...** を先に <strong> に変換する。
 */
function fixJapaneseEmphasis(source: string): string {
  let inFence = false;
  return source
    .split("\n")
    .map((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      return line
        .split(/(`[^`]*`)/)
        .map((part) => (part.startsWith("`") ? part : part.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>")))
        .join("");
    })
    .join("\n");
}

/** Markdown を HTML にし、目次用に h2 の一覧も返す */
export function renderMarkdown(source: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const marked = new Marked({
    gfm: true,
    renderer: {
      code({ text, lang }: Tokens.Code) {
        const label = lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : "";
        // ```ts bad / ```ts good で「悪い例・良い例」の色付け
        const [language, variant] = (lang ?? "").split(/\s+/);
        const cls = variant === "bad" ? " code-bad" : variant === "good" ? " code-good" : "";
        const tag = variant === "bad" ? '<span class="code-tag bad">✕ 悪い例</span>' : variant === "good" ? '<span class="code-tag good">○ 良い例</span>' : "";
        const body = language === "text" ? escapeHtml(text) : highlight(text, language || "typescript");
        return `<div class="code-block${cls}">${tag || (language === "text" ? "" : label)}<pre><code class="hljs">${body}</code></pre></div>`;
      },
      heading({ tokens, depth }: Tokens.Heading) {
        const text = this.parser.parseInline(tokens);
        if (depth === 2) {
          const id = `sec-${headings.length + 1}`;
          headings.push({ id, text: text.replace(/<[^>]+>/g, "") });
          return `<h2 id="${id}">${text}</h2>`;
        }
        return `<h${depth}>${text}</h${depth}>`;
      },
      blockquote({ tokens }: Tokens.Blockquote) {
        const body = this.parser.parse(tokens);
        // > **ポイント** / > **注意** などで種類を分ける
        const kind = /^<p><strong>(注意|落とし穴|NG)/.test(body)
          ? "warn"
          : /^<p><strong>(面接|面接では)/.test(body)
            ? "interview"
            : "point";
        return `<blockquote class="callout callout-${kind}">${body}</blockquote>`;
      },
    },
  });
  const html = marked.parse(fixJapaneseEmphasis(source), { async: false });
  return { html, headings };
}
