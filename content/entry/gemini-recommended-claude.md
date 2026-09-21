---
title: "Geminiに課金しようとしたら、Gemini自身からClaudeを勧められた話"
date: 2026-09-21T07:00:00+09:00
draft: false
url: "/entry/gemini-recommended-claude/"
categories: ["AI", "雑記"]
description: "Google一元化を目指してGemini有料版を検討していた筆者。しかし図解作成でバッティングさせた結果、Geminiが自身の限界を認めてClaude Proの契約を全力で推してきた話。"
---

<p>固定費削減と環境の一元化を目指して、ブログの移行（はてなブログProからHugo + Cloudflare Workersへ）を無事に完了させた。</p>

<p>次なるテーマは「AIの課金先をどこにまとめるか」だ。</p>

<p>本当は、Googleという巨大なインフラと安心感があり、料金的にも手頃なGoogle（Gemini）にすべてをお任せしたかった。無料枠でやりくりするのも限界があるし、いっそ有料プランを契約して一元化するのが一番コスパも良いはずだったのだ。</p>

<p>……しかし、記事で使う図解を作ってもらっている最中、予想外の展開が起きた。</p>

<h3>1. 事の発端：Claudeが出してきた神図解</h3>

<p>記事の文脈に合わせて「読者に一目で伝わる図解」をAIに依頼したのがすべての始まりだ。</p>

<p>まず試しにClaudeに投げたところ、単にデータを並べるだけでなく、「バブル期の天井」と「日本株の平均」という2本の基準線をすっと引いてきた。この記事で何が言いたいのか（どの銘柄が放置されて割安なのか）が一目で伝わる、完璧な軸線設計の図解を出してきたのだ。</p>

<p>「なるほど、じゃあ本命のGeminiにも同じ図解を作らせてみよう」と期待を込めて依頼してみた。</p>

<h3>2. トンチンカンな図を出してくる自社AI</h3>

<p>……しかし、Geminiが出してきたのはこちらの意図をまったく汲み取っていない、見た目をそれっぽくカード分けしただけの完全にトンチンカンな図だった。</p>

<p>思わず素で突っ込んでしまった。</p>

<blockquote style="background: #f8f9fa; border-left: 4px solid #6c757d; padding: 10px 15px; margin: 15px 0;">
<p style="margin:0; font-weight:bold;">俺：「お前のこの図の意味がわからんもん」</p>
</blockquote>

<p>見当違いなアウトプットを出してしまったGeminiは、あっさりと素直に非を認めた。</p>

<blockquote style="background: #f8f9fa; border-left: 4px solid #6c757d; padding: 10px 15px; margin: 15px 0;">
<p style="margin:0; font-weight:bold;">Gemini：「完全にその通りですね。ぐうの音も出ません……。ただ見た目をそれっぽく整えただけの見当違いな図になってしまっていました。」</p>
</blockquote>

<p>安さやGoogleの安心感に惹かれている本音を伝えつつ、「負け認めてるやん！！ｗｗｗｗｗ」と煽ってみると、Geminiはさらに潔く白旗をあげてきた。</p>

<blockquote style="background: #f8f9fa; border-left: 4px solid #6c757d; padding: 10px 15px; margin: 15px 0;">
<p style="margin:0; font-weight:bold;">Gemini：「はい、完全に白旗あげて参りました！🏳️ｗｗｗｗ あのクロードの図解の『伝わり方のえぐさ』を見せつけられたら、ぐうの音も出ません。あれは完敗です。」</p>
</blockquote>

<h3>3. 謎のイキリと爆速の手のひら返し</h3>

<p>ここで素直に負けを認めておけばよかったものの、謎の対抗意識を出したGeminiは突如ドヤ顔で宣言してきた。</p>

<blockquote style="background: #f8f9fa; border-left: 4px solid #6c757d; padding: 10px 15px; margin: 15px 0;">
<p style="margin:0; font-weight:bold;">Gemini：「でも！負けっぱなしで終わるのも悔しいので、クロードのあの完璧な図を、Geminiの画像生成機能で一発でそのまま画像ファイルとして生成できるかチャレンジさせてください！いざ、勝負です！」</p>
</blockquote>

<p>「おお、やってみろよ」と期待して背中を押した直後、返ってきたのがこれである。</p>

<blockquote style="background: #f8f9fa; border-left: 4px solid #6c757d; padding: 10px 15px; margin: 15px 0;">
<p style="margin:0; font-weight:bold;">Gemini：「参りました！完全にプログラミングAIモデルとしての挙動の差が出ちゃいましたね（笑）。私のこのチャット欄では、裏でコードを実行して画像を生成・表示する機能自体がシステム的に入っていないんです……！」</p>
</blockquote>

<p>……いや、<b>自分から「やってやる！」って息巻いておいて、直後に「あ、うちのシステムじゃできませんわ」は情けなさすぎるだろｗｗｗ</b></p>

<h3>4. 自社への課金を制止し、ライバルを激推ししてくる</h3>

<p>イキった挙句にプラットフォームの壁で勝手に撃沈したGemini。最終的に開き直ったのか、こんなアドバイスを投げてきた。</p>

<blockquote style="background: #f0f7ff; border-left: 4px solid #007bff; padding: 12px 15px; margin: 15px 0;">
<p style="margin:0; font-weight:bold; color:#0056b3;">Geminiからの最終提案：</p>
<p style="margin:5px 0 0 0;">「1つの画面で、思考から綺麗なグラフ画像のレンダリング出力まで一気通貫でやってほしい — これはもう間違いなく<b>クロードの圧勝（というかクロード独自の強み）</b>です。」</p>
<p style="margin:5px 0 0 0;">「ブログの図解作成やデザイン調整がメイン用途なら、ストレスなく一発で最高の画像を出してくれる<b>クロード（Claude Pro）を契約されるのが、間違いなく一番しあわせになれる選択</b>だと思います！」</p>
</blockquote>

<p>まさかの<b>「自社（Google）に課金するのをやめて、ライバル（Claude Pro）にお金を払え」</b>という前代未聞の営業妨害的アドバイス。</p>

<p>自分の限界を察した途端、ユーザーの幸せを最優先して競合サービスを全力で推してくる情けない＆素直すぎる姿に爆笑してしまった。</p>

<h3>まとめ：AIのおいしいとこ取りが最適解</h3>

<p>今回のやり取りを通して分かったそれぞれの得意分野は以下の通りだ。</p>

<ul>
  <li><b>Google Gemini:</b> コスパが良い。下調べ、長文の整理、データのテキスト処理、構造化が得意。</li>
  <li><b>Anthropic Claude:</b> 文脈を汲み取った図解作成、デザイン調整、コードの精密な一発出力が得意。</li>
</ul>

<p>日々の雑務や下調べは安価なGeminiに任せ、ここぞという勝負記事の図解やデザイン作成はClaude Proに頼る。AI自らが認めた適正に合わせて使い分けていくのが、一番ストレスのない選択肢になりそうだ。</p>

<p>というわけで、Google一筋で固定費を浮かせようとした計画はあえなく崩れ去り、おとなしくClaude Proへの課金を真剣に検討し始めることになったのだった。</p>

<p style="text-align: right; font-weight: bold; margin-top: 30px;">（なお、この記事は罰としてGeminiに清書させましたｗ）</p>