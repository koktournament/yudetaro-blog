#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ゴブリン洞穴 ― 自動GMランナー（雛形）

ゲームのAPIをロングポーリングで待ち受け、プレイヤーの宣言が来たときだけ
LLM（頭脳）を起こして裁定させる、という形の常駐スクリプトです。
待ち受け自体はただのHTTPループなので、LLMの無料枠は宣言への応答分しか消費しません。
頭脳は OpenAI互換のチャットAPIなら差し替えできます（Gemini / Groq / OpenRouter など）。

使い方:
  1. プレイヤーに部屋（あいことば）を作ってもらう
  2. 環境変数を設定して実行する:

  TRPG_CODE=mura482 \
  LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/ \
  LLM_API_KEY=（AI Studioで無料発行したキー） \
  LLM_MODEL=gemini-2.5-flash-lite \
  python3 gm-runner.py

  Groqの例: LLM_BASE_URL=https://api.groq.com/openai/v1
            LLM_MODEL=openai/gpt-oss-120b

物語が終わると（勝敗が決まると）ランナーは終了します。
Ctrl+Cでいつでも止められます（ゲームの状態はサーバ側に残ります）。
"""
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error

BASE = os.environ.get("TRPG_BASE", "https://www.yudetaro.com").rstrip("/")
CODE = os.environ.get("TRPG_CODE", "")
LLM_BASE = os.environ.get("LLM_BASE_URL", "").rstrip("/")
LLM_KEY = os.environ.get("LLM_API_KEY", "")
LLM_MODEL = os.environ.get("LLM_MODEL", "")
UA = {"User-Agent": "Mozilla/5.0 (gm-runner; goblin-trpg)"}

OUTPUT_RULES = """

---
[実行形式の指定]
あなたは上記マニュアルのGMです。ユーザーメッセージには現在の gmSummary（状態サマリ）が渡されます。
応答は必ず次のJSONだけを返してください。説明文・マークダウン・コードフェンスは禁止です。
{"actions":[ ... ]}
actions の要素は次のいずれかです:
  {"api":"interpret","spec":{"as":"action","action":{"type":"..."}}}
  {"api":"interpret","spec":{"as":"free","tier":"easy|normal|hard","reward":"...","custom":{"name":"...","effect":"atk|heal|none"}}}
  {"api":"interpret","spec":{"as":"fiction"}}
  {"api":"interpret","spec":{"as":"reject"}}
  {"api":"rule","tier":"easy|normal|hard|auto|reject","reward":"...","custom":{"name":"...","effect":"atk|heal|none"}}
  {"api":"narrate","text":"（語りやNPCの台詞。日本語で）"}
  {"api":"action","action":{"type":"..."}}
宣言がない場面では、narrate だけ、または {"actions":[]} を返してください。
語りの順序の目安：通常行動・移動は先に narrate で場面を描いてから interpret、自由行動は結果に合う narrate を後に。
ゲーム内の出力（語り・台詞）はすべて日本語で書いてください。
"""


def _curl_json(url, body, headers, timeout):
    import shutil
    import subprocess
    if not shutil.which("curl"):
        raise RuntimeError("curl が見つかりません")
    cmd = ["curl", "-sL", "--max-time", str(timeout + 10), "-A", UA["User-Agent"]]
    for k, v in (headers or {}).items():
        cmd += ["-H", f"{k}: {v}"]
    if body is not None:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(body)]
    cmd.append(url)
    out = subprocess.run(cmd, capture_output=True, timeout=timeout + 20)
    if out.returncode != 0:
        raise RuntimeError("curl failed: " + out.stderr.decode("utf-8", "replace")[:120])
    return json.loads(out.stdout.decode("utf-8"))


def http_json(url, body=None, headers=None, timeout=40):
    h = dict(UA)
    if headers:
        h.update(headers)
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        h["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError:
        raise  # サーバが応答したエラー（400等）は再送しない
    except Exception:
        # 一部のネットワーク環境では Python の HTTPS が途中で切れるため curl にフォールバック
        return _curl_json(url, body, headers, timeout)


def fetch_text(url):
    try:
        req = urllib.request.Request(url, headers={**UA, "Accept-Encoding": "identity"})
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read().decode("utf-8", "replace")
    except Exception:
        pass
    # 一部の環境では静的ページへの接続が切断されるため、curl があればそちらで取り直す
    import shutil
    import subprocess
    if shutil.which("curl"):
        out = subprocess.run(["curl", "-sL", "--max-time", "30", "-A", UA["User-Agent"], url],
                             capture_output=True, timeout=40)
        if out.returncode == 0 and out.stdout:
            return out.stdout.decode("utf-8", "replace")
    raise RuntimeError("ページを取得できませんでした: " + url)


def fetch_manual():
    url = BASE + "/games/goblin-trpg/muse"
    html = None
    last = None
    for _ in range(3):
        try:
            html = fetch_text(url)
            break
        except Exception as e:  # 接続が途中で切れる環境があるため、数回まで再試行する
            last = e
            time.sleep(2)
    if html is None:
        raise RuntimeError(f"マニュアルの取得に失敗しました: {last}")
    text = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", html)
    text = re.sub(r"<[^>]+>", "\n", text)
    text = re.sub(r"&[a-z]+;", " ", text)
    text = re.sub(r"\n\s*\n+", "\n", text).strip()
    return text[:60000]


def call_llm(system, user):
    body = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.7,
    }
    res = http_json(LLM_BASE + "/chat/completions", body,
                    {"Authorization": "Bearer " + LLM_KEY}, timeout=90)
    return res["choices"][0]["message"]["content"]


def parse_actions(text):
    t = text.strip()
    t = re.sub(r"^```(json)?|```$", "", t, flags=re.M).strip()
    obj = json.loads(t)
    acts = obj.get("actions")
    if not isinstance(acts, list):
        raise ValueError("actions list not found")
    return acts


def post_game(api, payload):
    body = {"code": CODE}
    body.update(payload)
    try:
        return http_json(BASE + "/api/trpg/" + api, body)
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:200]
        print(f"  [warn] POST {api} -> {e.code} {detail}", file=sys.stderr)
        return None


def main():
    if not CODE or not LLM_BASE or not LLM_KEY or not LLM_MODEL:
        print("環境変数 TRPG_CODE / LLM_BASE_URL / LLM_API_KEY / LLM_MODEL を設定してください",
              file=sys.stderr)
        return 1
    print(f"マニュアルを取得しています: {BASE}/games/goblin-trpg/muse")
    manual = fetch_manual()
    system = manual + OUTPUT_RULES
    print(f"GMランナー開始（部屋: {CODE} / 頭脳: {LLM_MODEL}）。宣言を待っています…")

    sig = None
    last_day = None
    last_combat = None
    while True:
        try:
            q = f"{BASE}/api/trpg/state?code={CODE}&role=gm&wait=25"
            if sig:
                q += f"&sig={sig}"
            view = http_json(q, timeout=40)
        except Exception as e:
            print(f"  [warn] state取得に失敗: {e}（5秒後に再試行）", file=sys.stderr)
            time.sleep(5)
            continue
        sig = view.get("sig", sig)

        if view.get("result"):
            print(f"物語は終わりました（結果: {view['result']}）。GMランナーを終了します。")
            return 0

        pending = bool(view.get("pendingTextContent") or view.get("pendingFreeText"))
        combat = bool(view.get("combat"))
        day = view.get("day")
        # 宣言があるときは必ず応答。日付の変化・戦闘の開始/終了のときは、語りの機会として一度だけ起こす
        event = pending or (last_day is not None and day != last_day) or \
            (last_combat is not None and combat != last_combat)
        last_day, last_combat = day, combat
        if not event:
            continue

        summary = view.get("gmSummary", "")
        print("GMを起こします:", "宣言あり" if pending else "場面の変化")
        try:
            raw = call_llm(system, summary)
            actions = parse_actions(raw)
        except Exception as e:
            print(f"  [warn] LLM応答を処理できませんでした: {e}", file=sys.stderr)
            continue
        for a in actions:
            api = a.pop("api", None)
            if api not in ("interpret", "rule", "narrate", "action"):
                print(f"  [warn] 不明なapi指定をスキップ: {api}", file=sys.stderr)
                continue
            print(f"  -> {api} {json.dumps(a, ensure_ascii=False)[:120]}")
            post_game(api, a)
        time.sleep(1)


if __name__ == "__main__":
    sys.exit(main())
