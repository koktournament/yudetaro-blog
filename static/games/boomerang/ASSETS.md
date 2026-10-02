# 採用素材と加工内容

- ゲーム中のシュウ：提供されたドット絵マスターシートを採用。黒背景、説明、罫線を画像編集で除去し、既存配置を保った透過PNGとして保存。
- ブーメラン：提供されたドット絵資料集の単体画像を透過抽出。
- 絵柄の異なる背面4コマ走りと設定資料は原本を保管し、ゲーム内では混在させていません。

使用ツール：組み込みimage_gen（背景透過編集）。原本はwork/source-artに保持しています。

## 使用したプロンプト

Atlas: Use case: background-extraction. Edit target: the attached Shu pixel-art master sheet. Prepare this SAME sheet for a browser game. Remove ALL black backgrounds, colored label panels, grid lines, header, captions and frame numbers, making them truly alpha transparent. Keep ONLY every character sprite. Preserve each existing sprite's artwork, pose, colors, proportions and its exact relative location on the full canvas, no rearranging, no new sprites, no resizing individual sprites. Preserve the full 4:3 canvas composition and empty cells. The seven existing sprite rows and their horizontal positions must remain unchanged. Do not redraw or redesign the hero. All dark hair, dark outlines and dark clothing that belong to sprites must remain opaque. Output actual transparent PNG, no checkerboard.

Weapon: Use case: background-extraction. Edit target: supplied Shu and boomerang reference sheet. Extract ONLY the large standalone wooden bent boomerang in the third panel (not the small equipped inset). Preserve exactly its pixel-art appearance, wood color, white cloth wraps, blue bands and blue jewel. Remove every other element, text, border, character and background. Center the single boomerang upright in a square transparent PNG, with 10 percent transparent margin. No shadow, no text, no extra objects, no redesign. This is a game weapon sprite. Keep crisp pixel art and genuine alpha transparency.

## 実装

sprites.jsが透過シートの必要範囲だけを描画。背面待機・背面4コマ走り・投擲後のポーズ・被弾・やられ状態を切り替えます。投擲ポーズには武器が手を離れたコマを使用し、飛行中の単体武器との二重表示を避けています。所持時は未所持用キャラに武器を別レイヤーで重ねます。戦闘ロジックと当たり判定は変更していません。

今回の対象は画像の組み込みです。導入会話、ステージ選択、リワード広告、ボス・王国兵の新画像はまだ実装していません。

## タイトル・導入追加（2026-09-30）
assets/title.png は提供「ChatGPT 画像 2026年9月29日 22_45_10.png」を無加工で使用。画像内はじめる位置に操作ボタンを配置。既存シートの正面コマを登場・会話に使用。導入と1面選択は実装済み。ボス・王国兵の専用画像、リワード広告は未実装。

## 追加画像 2026-09-30
使用: built-in image_gen。会話のshu-reference.png/guard-reference.pngは提供画像の無加工コピーで、story-art.jsがイラスト部分を表示。
生成物: dist/assets/shu-walk-v2.png、guard.png、soldier-portrait.png。

### Final prompt set
Walk creation: Create a game-ready transparent sprite atlas based on the referenced Shu character (reference for identity only). 1536x1024 landscape canvas, exactly 3 columns and 2 rows of equal 512x512 cells, SIX sprites. All six full-body BACK VIEW facing exactly up-screen, identical scale/camera/design, ground anchor at each cell center x and y=440 relative to cell. Pixel art 16-bit style, brown spiky hair, orange headband tails, yellow short cape, blue tunic, cream trousers and brown boots. NO weapon anywhere, no text, no panels, no shadows, transparent background. The SIX frames form a smooth looping walk: frame 1 left foot forward right back; frame 2 left passing under hip; frame 3 right foot forward left back; frame 4 right passing under hip; frame 5 left contact transition; frame 6 standing idle both feet planted. Keep shoulders/head registered, minimal bob, distinctly alternating left and right feet, cape slight sway. Each sprite occupies center 260px wide x 340px high within cell. Avoid large running kicks, pose duplicates, profile/front faces or sideways turning. Must be consistent enough to animate without size or position jitter.
Walk final cleanup: Edit target: this six-frame Shu game sprite atlas. Background extraction only. Remove ALL black/brown background and glowing halos between and behind the six characters, replace with actual fully transparent pixels alpha=0. Preserve the six characters exactly: positions, dimensions, poses, colors, all pixels inside characters, 3 columns x 2 rows on 1536x1024. NO new backdrop, NO glow or shadow, NO checkerboard. Only six clean isolated character sprites on genuine transparency. Keep entire canvas same size.
Boss: Extract the single front-facing idle pixel art armored shield captain from the upper LEFT idle panel of this reference. Game sprite cutout, one character only on genuine transparent alpha background. Preserve front view facing viewer/downscreen, dark horned helmet with narrow red eye slit, black steel armor red trim, huge rectangular shield centered in front bearing red trident insignia, both feet visible. Remove tile floor, panels, headings, all text, arrows, other characters and effects. Center full body with 12% transparent margin. Crisp pixel art. No shadow, no glow, no colored or black background. This is the game's single boss sprite. Keep the reference identity and proportions.
Soldier: Create ONE square illustrated dialogue portrait for a friendly adult kingdom foot soldier NPC in the SAME warm hand-painted anime storybook style as the right-hand conversation portraits in the reference. New character, NOT Shu: brown short hair, simple open-face silver helmet without horns, blue padded uniform, silver shoulder guards. Head and shoulders fill frame, youthful adult, expressive brown eyes, slightly worried and baffled face, mouth open a little, facing 3/4 right toward the dialogue. Plain warm parchment backdrop. High quality ink outlines and soft painted shading, NOT pixel art. NO text, speech balloons, labels, letters, panel borders, weapons in front of face. Safe margins around helmet.

## 兵士/BGM 2026-10-01
提供曲: タイトル画面.mp3 → dist/assets/audio/title.mp3、会話シーン.mp3 → story.mp3、Stage 1 Battle Theme.mp3 → battle.mp3。全曲無加工。
提供絵 image-gen-2(6).png → dist/assets/soldier-reference.png（無加工コピー、実行時に顔を切り出して描画）。
透過抽出: built-in image_gen → dist/assets/soldier-back.png。
Prompt: Extract ONLY the very first bottom-left back-view idle pixel-art kingdom soldier from this reference sheet. Silver rounded helmet, blue tabard with white fleur-de-lis symbol, short brown boots, sword held on his right. Single full-body back-facing sprite, exactly matching reference design, crisp pixels. Remove all text, floor, arrows, panels, other figures. Center on square truly transparent alpha background with 10% margin. No shadow, glow, background color, or checkerboard. Intended as game sprite facing up-screen; retain head-to-body proportions.

## Stage 2 update · 2026-10-01
- battlefield.png: provided stage image 2026年10月1日 19_51_23, unchanged.
- buckler-reference.png: provided 2026年10月1日 20_23_39, unchanged; illustration portraits selected at runtime.
- guard-reference.png: existing provided artwork, now used in enlarged Stage 1 back-reveal cut-in.
- buckler-sprites.png: built-in image_gen transparent three-pose sheet. Source: C:/Users/user/.codex/generated_images/01a0e830-1bbe-78a2-92ea-766484a39d42/exec-827254e0-7036-43d0-bbaa-23bb136d9ed5.png. Native size 2172×724; anchors registered in StoryArt.drawBuckler.
Final prompt: Create a game-ready transparent PNG sprite sheet from the supplied Buckler vice captain reference. Exactly 3 equal square cells in one horizontal row. Each cell contains the same full-body front-facing top-down 16-bit pixel-art knight, large shield ALWAYS covering chest front, horned dark steel helmet, red plume and scarf, slimmer muscular build. Cell 1 neutral shield guard sword low. Cell 2 sword raised above his right shoulder while shield unchanged. Cell 3 sword swung outward while shield unchanged. All feet on same baseline, identical size and body/feet positions across cells. No text, no borders, no ground, no shadows, no effects, no bullets, actual alpha transparency. Faithfully preserve reference character design. Leave ample clear padding per cell. Output wide 1536x512 if possible.

## Stage 3 update · 2026-10-02
- battlefield.png: provided `ChatGPT 画像 2026年10月1日 21_57_58.png` (stone courtyard), used unchanged in place of the sand arena so the boomerang remains easy to see.
- targe-reference.png: provided `ChatGPT 画像 2026年10月1日 22_22_25.png`, used unchanged for Targe's dialogue portraits and shield cut-in.
- stage-clear.png: provided `ChatGPT 画像 2026年10月1日 22_44_58.png`, used unchanged as the shared clear image for all stages.
- targe-sprites.png: built-in imagegen transparent three-pose sheet. Source: `C:/Users/user/.codex/generated_images/01a0e830-1bbe-78a2-92ea-766484a39d42/exec-8c6ab59a-3d73-49fe-845c-f375b6972abb.png`. StoryArt registers its three equal cells as guard, moving, and firing poses.

Final prompt: Create a game-ready transparent PNG sprite sheet from the supplied Targe captain reference. Exactly 3 equal square cells in one horizontal row. Each cell contains the same full-body top-down 16-bit pixel-art knight, slightly taller than Shu but short and stocky, wearing dark worn steel armour, red scarf and horned helmet. Hold a huge L-shaped metal shield on his LEFT: the front panel faces down-screen and the side panel extends to screen-left, making a clear L silhouette. Cell 1 is a neutral guard; cell 2 is a walking guard; cell 3 fires while moving with the shield still held. Identical body scale and ground anchor in every cell. No text, panels, floor, shadows, effects, bullets, or background; genuine alpha transparency. Preserve the supplied character identity.

## Stage 4 update · 2026-10-02
- warden-reference.png: provided `ChatGPT 画像 2026年10月2日 20_21_02.png`, used unchanged for Warden's dialogue portrait.
- audio/battle4.mp3: provided `Stage ４ Battle Theme.mp3`, used unchanged after the Stage 4 warning sequence.
- warden-sprites.png: built-in imagegen transparent five-cell sheet. Source: `C:/Users/user/.codex/generated_images/01a0e830-1bbe-78a2-92ea-766484a39d42/exec-70d88811-07ba-4c6f-9c0a-ab3dca49eb95.png`. Cells are Warden idle, cast, hit, staff, and a floating shield panel.

Final prompt: Use the supplied Warden court magician reference only to preserve character and prop identity. Create one wide transparent PNG with exactly 5 equal square cells in a single horizontal row. Cell 1: Warden, a hooded blue-and-gold imperial mage, full body, top-down action-game view, neutral floating pose. Cell 2: the same Warden casting, hands raised. Cell 3: the same Warden hit reaction. Cell 4: one tall blue glowing magical staff planted in the ground, full prop. Cell 5: one blue-and-gold floating shield panel, full prop. 16-bit pixel art with crisp readable outlines, consistent scale, all objects centered within their own cell, ample transparent padding, no floor, no characters besides Warden, no text, panels, effects, shadows, watermark, or background. Preserve actual alpha transparency.

## Dialogue cut-outs · 2026-10-02
- targe-front-cutout.png: built-in imagegen transparent extraction from targe-reference.png. Used only for Targe's full-body front cut-in during the Stage 3 weakness line.
- warden-portrait.png: built-in imagegen transparent extraction from warden-reference.png. Used for Warden's Stage 4 dialogue portrait.

Targe prompt: Extract only the large full-body front-view Targe captain from the supplied reference. Preserve the entire dark-armoured captain, horned helmet, red scarf, and L-shaped shield. Remove all labels, panels, background, other views, and floor. Genuine transparent PNG.

Warden prompt: Extract only the front-view Warden court magician from the supplied reference. Make a clean head-and-upper-body dialogue portrait with the hood, glowing eyes, blue-and-gold robe, and visible hands. Remove all labels, panels, background, other views, shields, diagrams, and floor. Genuine transparent PNG.
