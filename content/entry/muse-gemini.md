---
title: "MuseからGemini 4が無料で使える ― 公式CLIを入れて実際に試した"
date: 2026-11-28T09:48:00+09:00
draft: false
url: "/entry/muse-gemini/"
categories: ["日常"]
description: "MuseからGoogleのGeminiを無料で呼ぶ方法。公式CLIのgemini-api-cliとAI Studioの無料APIキーで接続し、モデル一覧50件とGemini 4 Hydrogenの文章生成まで無料キーでできた実測記録。"
cover:
  image: "/images/muse-gemini-cover.webp"
  alt: "書類の束を星のロボットに手渡すジト目ネコ"
showToc: true
tocopen: true
---

Museを使っていると、使用量の上限が気になる。長い文書を読ませたり画像を作らせたりすると、本題の作業に入る前に枠が減っていく。

Googleが公式のCLIツールを出していて、無料のAPIキーと組み合わせると、MuseからGeminiを直接呼べる。2026年11月に出たばかりのGemini 4も無料キーで呼べた。手順と実測結果を書いておく。

## 用意するもの

- Museが使える環境
- Googleアカウント（APIキーを取るのに使う）

お金はかからない。Google公式のオープンソースツール「gemini-api-cli」と、AI Studioで取れる無料のAPIキーだけだ。

## 手順

### 1. gemini-api-cli を入れる

gemini-api-cli は、コマンドラインからGemini APIを呼ぶためのGoogle公式ツールだ。2026年10月27日にベータ版が公開されて、今のバージョンは v0.5.0。GitHub の google-gemini/gemini-api-cli で中身も公開されている。

入れるのは公式スクリプト1行で済む。スクリプトの中身を確認してから実行すること。

### 2. AI Studioで無料のAPIキーを取る

aistudio.google.com/apikey を開いて、GoogleアカウントでAPIキーを作る。プロジェクトを持っていない場合は、キーを作るときに自動で用意される。無料枠のキーでいい。

### 3. Museにキーを登録する

キーをMuse側に登録すると、Museの作業環境からGemini APIを呼べるようになる。キーはパスワードと同じものだ。チャットに貼ったりせず、安全な入力画面から登録する。

## 実測結果

つないでから確認できたこと。

- 呼べるモデルの一覧は **50件**。
- 一覧には Gemini 4 の4モデル（Argon / Carbon / Hydrogen / Neon）が全部入っている。
- gemini-3.5-flash-lite で文章生成ができた。
- **gemini-4-hydrogen も無料キーで文章生成ができた。**

試しにGeminiに自己紹介を頼んだら、「Museさんのお手伝いができること、大変嬉しく思います」と返ってきた。別の会社のAI同士が普通に仕事を回し合っている。

## 何に使えるか

MuseからGeminiに投げられる仕事は、だいたいこの辺だ。

- 画像や動画を作らせる。
- 長いPDFや録画・録音を読ませて、要約や結論だけ受け取る。
- 時間のかかる調査を後ろで回して、終わったら結果を受け取る。

どれもMuse側の使用量を食う作業だ。外に出せる分だけ、本題に枠を残せる。課金を増やさずに、使えるAIの頭数だけが増える。

## 注意点

- 無料枠には上限がある。無制限ではない。重い作業を全部投げる使い方はできない。
- 無料で使えるモデルや枠の条件は変わりやすい。この記事は2026年11月28日時点の実測だ。
- APIキーはパスワードと同じ扱いをする。公開しない。チャットに貼らない。
