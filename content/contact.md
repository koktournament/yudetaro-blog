---
title: "お問い合わせ"
date: 2026-11-17T23:15:00+09:00
draft: false
url: "/contact/"
description: "yudetaro.comへのお問い合わせフォーム。記事への感想、間違いの指摘、リンク切れの報告などはこちらから。"
---

記事への感想、間違いの指摘、リンク切れの報告などはこちらからどうぞ。

返信が必要な場合は、メールアドレスも入力してください。

<form id="contact-form">
  <p><label>お名前（任意）<br><input type="text" id="cf-name" maxlength="40" style="width:100%;padding:.5em;box-sizing:border-box"></label></p>
  <p><label>メールアドレス（返信が必要な場合）<br><input type="email" id="cf-email" maxlength="120" style="width:100%;padding:.5em;box-sizing:border-box"></label></p>
  <p><label>本文<br><textarea id="cf-body" rows="8" style="width:100%;padding:.5em;box-sizing:border-box"></textarea></label></p>
  <input type="text" id="cf-hp" name="hp" style="display:none" tabindex="-1" autocomplete="off">
  <p><button type="submit" style="padding:.6em 2em;cursor:pointer">送信する</button></p>
  <p id="cf-msg"></p>
</form>

<script>
document.getElementById('contact-form').addEventListener('submit', function(e) {
  e.preventDefault();
  var msg = document.getElementById('cf-msg');
  var body = document.getElementById('cf-body').value.trim();
  if (!body) { msg.textContent = '本文を入力してください。'; return; }
  msg.textContent = '送信中…';
  fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: document.getElementById('cf-name').value, email: document.getElementById('cf-email').value, body: body, hp: document.getElementById('cf-hp').value }) })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.ok) { msg.textContent = '送信しました。ありがとうございました。'; document.getElementById('contact-form').reset(); }
      else { msg.textContent = d.error || '送信に失敗しました。'; }
    })
    .catch(function() { msg.textContent = '送信に失敗しました。'; });
});
</script>
