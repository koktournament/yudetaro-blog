/* 観察の物語だけを増やす。条件・確率・名称データは試遊で調整可能。 */
const TITLE_JP = `錆びた太陽|夜行列車|灰色の虹|ガラスの街|未完成の地図|午前四時の星|透明な傷|沈黙の花|昨日の未来|青空の底|雨粒の王国|孤独の速度|街灯の海|最後の夏休み|電線の鳥|眠れない魚|路地裏の天使|砂時計の嘘|風待ちの駅|影のない午後|昨日を燃やせ|不器用な翼|星屑の切符|空白の手紙|誰もいない祝日|夜をほどく|さよならの練習|遠吠えの季節|月曜日の幽霊|迷子の雷|世界の継ぎ目|モノクロの約束|熱の残り火|寝不足の世界|消えない足音|街の呼吸|欠けたレコード|花束とノイズ|雨宿りの歌|真昼の逃避行|壊れた羅針盤|まだ名前はない|屋上の秘密|君のいない駅|夏の抜け殻|ふたりぶんの夜|夢の置き場所|海まで歩こう|薄明の標識|青い非常口|砂のメロディ|夜明け前の犬|光の忘れ物|見えない火花|歪んだ春|窓際の革命|地図にない家|雲の切れ端|心臓の裏側|昨日の靴|白線の向こう|冷たい花火|秘密の周波数|最後のバス|夕暮れの王様|傷だらけの風|燃えない手紙|四畳半の宇宙|まぶしい廃墟|声になる前|走り書きの夢|地下室の朝|境界線の猫|灯りを消さないで|ビルの谷間|雨の輪郭|君と停電|遥かなる踊り場|朝焼けの逃亡者|埃のダイヤモンド|約束の残響|眠らない窓|あの日のアンプ|空を売る店|夕立のあとで|生活のリズム|胸ポケットの嵐|銀河の裏口|遠回りの終点|夏を置いてきた|赤信号のブルース|夢見る錆|夕暮れを盗め|ノイズのない夜|片道の青春|微熱の街|言葉の切れ端|風の通り道|明日への落書き|星を拾う人|散らかった楽園|地球の片隅|孤独な祝砲|夜の背中|忘れたくない嘘|十秒の永遠|名前を呼んで|屋根の上のブルース|もう一度だけ|バス停の宇宙|笑えない月|破れたカレンダー|花のない庭|北風の約束|永遠の手前|誰かの朝|夏の亡霊|空っぽのステージ|記憶の波形|灰と宝石|君に届く距離|生活と爆音|世界の端で待つ|始発までの自由|切れない弦|静かな逆襲|スピーカーの向こう|降りない駅|さよならの続き|夢から醒めても`.split('|');
const TITLE_EN = `DEAD AIR|VELVET STATIC|NEON RIVER|BROKEN COMPASS|EMPTY STATION|AFTER THE RAIN|LAST BUS HOME|WILD SIGNAL|BLUE REBELLION|DUST AND STARS|SLEEPLESS TOWN|NIGHT SWIM|PAPER MOON|SLOW BURN|GLASS ANIMAL|OUT OF FRAME|LITTLE RIOT|SECOND SUN|ECHO CHAMBER|NO RETURN|CHEAP PARADISE|DIRTY HALO|SILENT ENGINE|CITY DOGS|BACKDOOR HEAVEN|ANOTHER MORNING|LOST FREQUENCY|FOUR WALLS|GHOST RADIO|BURN THE MAP|SUNSET GARAGE|EVERYDAY HERO|CRACKED MIRROR|WHITE LIES|FAR FROM HOME|BLACK COFFEE|FEVER DREAM|NOISE FLOWER|HIGH WATER|COLD SPARK|UNDER THE WIRES|JUNK HEART|LAST LIGHT|ZERO GRAVITY|OPEN WINDOW|WORN OUT SHOES|SOMEWHERE ELSE|RUST NEVER SLEEPS HERE|AFTERIMAGE|WASTED SUMMER|RED HORIZON|STRAY DOG DAYS|NEVER STILL|HALF A WORLD|ALMOST TOMORROW|NO SUGAR|SIDE STREET|UNFINISHED|SKYLINE MOTEL|SILVER LINE|NIGHT SHIFT|ONE MORE MILE|HOLLOW SUN|FAINT SIGNAL|WE ARE HERE|DREAM FACTORY|LOVE AND FEEDBACK|THE LONG WAY|DARKROOM|MIDNIGHT CHILDREN|OFF THE RECORD|ROOM 18|HOME MADE THUNDER|LATE BLOOM|MISSING PIECE|GRAVEL ROAD|STAND BY ME TONIGHT|TURN IT UP|GONE BUT HERE|NOTHING TO LOSE|SUNDAY GHOST|LAST TRAIN BLUE|SOUND OF DUST|BEFORE WE GO|WARM MACHINE|PARKING LOT ANGELS|A SMALL FIRE|UNTIL THE LIGHT|NO MORE SILENCE|ELECTRIC DIARY`.split('|');
const TITLE_FRAGMENTS={left:`真夜中の|明け方の|雨上がりの|忘れられた|眠れない|最後の|透明な|名前のない|路地裏の|青い|錆びた|不器用な|遠い|昨日の|壊れた|裸足の|誰も知らない|夏の|ささやかな|帰り道の|星のない|風待ちの|空っぽの|放課後の|地下室の|ひとりぼっちの|夜明け前の|小さな|二度目の|古ぼけた`.split('|'),right:`灯台|合図|足跡|自由|未来|切符|日記|衝動|祈り|横顔|逃走|記憶|口笛|革命|風景|手紙|季節|光|歌|翼|秘密|約束|旅人|扉|鼓動|雷鳴|花束|残響|地図|舞台`.split('|')};
function titleCandidates(){return [...TITLE_JP,...TITLE_EN,...TITLE_FRAGMENTS.left.flatMap(a=>TITLE_FRAGMENTS.right.map(z=>a+z))]}
function readRecentMusic(){try{return JSON.parse(localStorage.getItem('band-yaro-ze-music-v2'))||[]}catch{return []}}
function rememberMusic(title){try{const old=readRecentMusic().filter(x=>x!==title);localStorage.setItem('band-yaro-ze-music-v2',JSON.stringify([...old,title].slice(-600)))}catch{}}
function freshMusicName(b,song=false){b.usedMusicTitles??=[];const used=new Set([...b.usedMusicTitles,...b.albums.map(a=>a.title),...b.songs.map(s=>s.title)]);const recent=new Set(readRecentMusic());const all=titleCandidates();const themed=all.filter(t=>song?true:!['もう一度だけ','名前を呼んで','海まで歩こう'].includes(t));let choices=themed.filter(t=>!used.has(t)&&!recent.has(t));if(!choices.length)choices=themed.filter(t=>!used.has(t));let title;if(choices.length)title=pick(choices);else{let n=1;do{title='UNTITLED / '+n++}while(used.has(title));}b.usedMusicTitles.push(title);rememberMusic(title);return title;}
const OPENING_LINES={plain:[
'18歳。聴く側だけで終わるのは、そろそろやめようと思う。',
'18歳。まだ仲間はいない。でも、バンドを始める。',
'18歳。部屋で歌っているだけじゃ、何も始まらない。',
'18歳。誰かと音を出してみたい。それだけは決まった。',
'18歳。好きなバンドのレコードを聴いて、じっとしていられなくなった。',
'18歳。最初の一歩がハガキ一枚でも、構わない。',
'18歳。何者でもない。だから、今から始める。',
'18歳。学校を出たら何をするか。俺は、バンドがいい。',
'18歳。昨日まで客席にいた。次はステージへ行きたい。',
'18歳。歌いたい曲がある。一緒に鳴らしてくれる奴を探そう。',
'18歳。この街にも、同じことを考えてる奴がいるはずだ。',
'18歳。友達には笑われた。でも、まだ諦める理由がない。',
'18歳。マイク一本と、やる気だけはある。',
'18歳。うまくいくかは知らない。一度くらい、やってみる。',
'18歳。初めてのライブを、今から想像している。',
'18歳。レコードの向こう側へ行ってみたい。'],
skill:['18歳。歌なら、少し自信がある。一緒に音を出す仲間が欲しい。','18歳。この声がどこまで届くか、ステージで試したい。','18歳。毎晩歌ってきた。今度は、誰かと合わせたい。'],
looks:['18歳。見た目の話はもう聞き飽きた。今度はバンドで名前を覚えてほしい。','18歳。写真だけで終わるつもりはない。マイクを持つ。','18歳。人前に出るのは嫌いじゃない。バンドを始めよう。'],
charisma:['18歳。まだ一曲も鳴ってないのに、ステージに立つ自分が見える。','18歳。俺とバンドをやろうぜ。……まずは、その相手を探す。','18歳。面白いことが起きる気がする。仲間を集めよう。'],
cooperation:['18歳。一人で歌うより、仲間と笑いながら音を出したい。','18歳。長く一緒にやれる奴が来てくれるといい。','18歳。すごいバンドもいいけど、まずはいい仲間が欲しい。']};
const POSTCARD_LINES=[
'18歳。まずは一緒に音を出そう。','18歳。初心者でも、やる気のある方。','18歳。同じ夢を見られる仲間を募集。','18歳。好きな音楽の話から始めよう。','18歳。練習場所は、集まってから相談。','18歳。ライブハウスのステージを目指します。','18歳。経験より、続けたい気持ちを重視。','18歳。まだ曲もバンド名もありません。','18歳。土曜の午後、スタジオで会おう。','18歳。音楽を聴くだけじゃ物足りない方。','18歳。まずは四人で一曲合わせたい。','18歳。声はある。あとは仲間が必要。'];
const RECRUIT_LINES=['返事をくれた3人と、初めて顔を合わせた。','雑誌の募集欄から、18歳の4人が集まった。','知らない顔が3つ。今日から、一緒に音を出す。','約束したスタジオに、4人が揃った。','一枚のハガキから、この4人につながった。','持ってきた音源の好みは違う。それでも4人が集まった。','電話越しで聞いた声が、ようやく顔とつながった。','誰もお互いを知らない。ここからバンドになる。'];
function chooseOpening(ms){const m=ms[0];const traits=['skill','looks','charisma','cooperation'].filter(k=>m[k]>=80);const key=traits.length&&Math.random()<.65?pick(traits):'plain';return {intro:openingChoice('intro',OPENING_LINES[key]),postcard:openingChoice('postcard',POSTCARD_LINES),recruit:openingChoice('recruit',RECRUIT_LINES)};}
const FORMATION_LINES=rows(`
スタジオの扉を開ける|最初は挨拶もぎこちなかった。音を出してみると、4人の間に少しだけ笑顔が増えた。
まずは一曲、合わせよう|知っている曲を一曲。途中で止まりながらも、4人は最後まで鳴らしてみた。
まだ何もない4人|曲も客もない。あるのは楽器と声と、今日ここへ来た4人だけだ。
名前のある始まり|バンド名を口にすると、急に本物になった気がした。4人はスタジオの予約表へ、その名前を書いた。
好きな音楽は違うけど|持ち寄った音源の好みはばらばら。それでも、誰かが始めたリズムに全員が乗った。
初対面の帰り道|最初の練習を終え、4人で駅へ歩いた。次の練習日だけは、すぐ決まった。
音を出す前の長話|好きなバンドの話が止まらない。時間がなくなる前に、ようやくアンプの電源を入れた。
4人ぶんの音|一人ずつ鳴らした音が、やっと同じ部屋で重なった。ここから、どんな音になるだろう。
誰から数える？|カウントを入れる人を決めるだけで、少しもたついた。それでも最初の一曲が始まった。
まだ名刺はいらない|連絡先を書いた紙を交換した。来週もこの4人で会う。その約束が、バンドの始まりだった。
スタジオの時計|借りた時間はあっという間だった。最後の五分、4人はもう一度同じ曲を合わせた。
合わないところから|テンポも入り方も揃わない。止めて、笑って、また最初から。自分たちの音を探し始めた。
古いアンプの前で|古いアンプと借り物のマイク。立派な始まりではないが、4人には十分だった。
最初の集合写真|練習帰りに一枚撮った。まだポーズも決まらない、これから始まるバンドの写真だった。
ノートの一ページ目|バンド名と4人の名前を書いた。まだ白いページに、これから何が残るのだろう。
次もこの4人で|初めての練習が終わった。「次、いつにする？」。その一言で、バンドが続くことになった。`);
const FIRST_LIVES=rows(`
初めてのライブ|照明がついた瞬間、頭が真っ白になった。それでもカウントが聞こえ、最初の一曲が始まった。
客席には、3人|初ライブの客は3人だった。広く見える客席へ、4人は持ち時間いっぱい演奏した。最後には、3人とも拍手をくれた。
幕の向こうへ|袖から見たステージは、思っていたより狭い。4人が並ぶと、逃げる場所はもうなかった。
最初の拍手|一曲目が終わる。わずかな間のあと、拍手が聞こえた。その音で、4人の肩が少し下がった。
緊張した声で|最初の挨拶で、バンド名を噛んだ。客席が笑ってくれたので、少しだけ楽になった。
初ライブの半券|終演後、客が半券を持って話しかけてきた。「次も来ます」。4人はその言葉を持ち帰った。
一曲目のカウント|カウントだけが、やけに大きく聞こえた。練習で何度も合わせた曲が、初めて客の前へ出た。
友達以外の客|客席に、自分たちの友達ではない人がいた。その人が最後まで残ってくれた。
袖で四人、顔を合わせる|出番の直前、誰からともなく顔を見た。言葉は出なかったが、そのままステージへ上がった。
音が外へ出た日|スタジオで鳴らしていた音が、初めて知らない人の前へ出た。終演後の疲れまで、いつもと違っていた。
初めての照明|赤い照明がまぶしい。客席の顔は見えないが、誰かがこちらを見ていることだけは分かった。
最後まで、やり切った|何度か危うい場面はあった。それでも途中で止めず、予定した曲を最後まで演奏した。
店長が見ていた|店長が客席の後ろで腕を組んでいた。終演後、「また出なよ」と声をかけてくれた。
初ライブの帰り道|機材を抱えて駅へ向かった。今日の失敗の話をしているうち、もう次のライブの話になった。
初めてのサウンドチェック|マイクに声を出すだけでも緊張した。本番が始まる頃には、少しだけステージに慣れていた。
出番は、短くても|持ち時間はあっという間。最後の曲が終わっても、4人の体にはまだ熱が残っていた。
セットリストの紙|足元に置いた紙を何度も見た。全部の曲を終えると、その紙まで大切なものになった。
客席からの、ひと声|演奏の合間、客が「がんばれ」と言った。4人は笑って、次の曲を始めた。
初ライブの記念写真|終演後、看板の前で4人並んだ。汗で髪は乱れていたが、誰も撮り直しを言わなかった。
予定通りにはいかない|挨拶も曲間も、練習の通りにはいかなかった。でも終わったあと、4人は次もやりたいと思った。
客のいるリハーサルじゃない|一曲目を終えた拍手で、これは練習ではないと分かった。4人は次の曲へ向き直った。
名前を呼ばれた日|出演者としてバンド名を呼ばれた。その名前が、初めて会場のスピーカーから響いた。
最前列の笑顔|一人の客が最前列で楽しそうに聴いていた。その顔だけは、演奏が終わっても覚えていた。
最初の一歩|出番が終わり、次のバンドへ場所を譲った。まだ何者でもない4人が、一度だけステージに立った。`);
function firstLiveEvent(b){const e=freshEvent(b,poolEntries('first-live',FIRST_LIVES));ensureChronicle(b);return {...e,text:e.text+'\n会場は〈'+b.story.venue+'〉。その後、録音や口コミも届き、次の公演を気にする人が増えた。',label:'FIRST LIVE',kind:'first',seed:e.title==='客席には、3人'?'threeFans':e.title==='店長が見ていた'?'mentor':null};}
function ordinaryFormation(b){return openingChoice('formation',FORMATION_LINES)}
const AMATEUR_EXTRA={
skill:rows(`
ベースとドラムの間|低い音とリズムがうまく絡んだ。派手なソロのない曲なのに、客が足で拍子を取っていた。
小さい音でも|静かな入り方に変えてみた。会場が耳を澄まし、最後のサビで一緒に盛り上がった。
本番で決まった一音|練習では何度も外したところが、本番では決まった。音楽好きの客が嬉しそうにうなずいた。
ボーカルが届く場所|音響スタッフが声の聴こえ方を整えた。歌詞まで聞いた客が、終演後に感想をくれた。
速い曲のあと|速い曲を勢いだけで終わらせなかった。最後までまとまった演奏に、対バンの客も拍手した。
テンポを落としてみた|少しゆっくり演奏すると、曲の輪郭が見えた。いつもの客が「今日の方が好き」と言った。
ハモりの瞬間|コーラスが重なったところで、客が顔を上げた。短いフレーズが耳に残ったらしい。
チューニングのあと|丁寧に音を合わせてから演奏した。派手さより、聴いていて気持ちいいという評判が残った。
一曲だけの試聴|楽器店でデモを一曲聴いてもらった。店員がその録音を知り合いにも勧めてくれた。
録り直したデモ|前より聴きやすくなった録音を渡した。ライブを知らなかった人が、日程を尋ねてきた。
貸しスタジオの受付|受付の人が練習の音を覚えていた。紹介された別のバンドが、本番を見に来た。
音を減らした曲|全員が鳴らし続けるのをやめると、一音ずつがよく聞こえた。その曲の感想が増えた。
スネアが響いた夜|ドラムの一打で曲が始まった。客の体が自然に動き、最後までリズムに乗っていた。
ベースを聴いていた客|終演後、低い音の話をする客がいた。派手ではないところまで聴いてくれていた。
ギターの余韻|最後の音が消えるまで、客が待った。弾き終わってから届いた拍手が、妙に嬉しかった。
息継ぎまで聴かれた|歌の途中で、会場が静かになった。声を追っていた客が、次のライブにも来ると言った。
同じ曲の違う顔|曲の入り方を変えた。何度も来る客が、その違いを友人に楽しそうに説明していた。
録音を聴いた先輩|持ち込んだデモを先輩が最後まで聴いた。「ライブで見たい」と、日程を手帳に書いた。
長いイントロ|歌が始まる前から客が乗っていた。4人の音だけで、曲へ引き込めた夜だった。
終わり方が決まった|全員が同じところで音を止めた。わずかな静けさのあと、客席から拍手が起きた。
知っている曲を一曲|カバーを演奏すると、客が自分たちの音の良さにも気づいた。続くオリジナルも聴いてくれた。
リズムに乗るスタッフ|ドリンクを作るスタッフの足が動いていた。常連に4人の演奏を勧めてくれた。
難しい曲をやり切る|展開の多い曲を最後まで合わせた。見ていた対バン相手が、袖で親指を立てた。
一枚のカセット|手渡したデモを何度も聴いた客が来た。今日はその友人も一緒だった。
少し上達した日|いつもの客が「音、よくなったね」と言った。長く聴いてくれている耳に届いた。
セットの流れ|曲順がうまくつながった。短い出番でも、一つのライブとして客の記憶に残った。
音量よりも、輪郭|ただ大きくするのをやめた。曲が聴きやすくなり、初めての客が最後まで残った。
歌詞の聞こえる夜|言葉がはっきり届いた。「あの一行が好き」と、感想の紙に書かれていた。
街の録音会|仲間内の録音会に参加した。4人の音源を気に入った別のバンドの客が、ライブへ来た。
客席からリズム|手拍子が、曲のリズムとうまく重なった。客も演奏の一部になったような夜だった。`),
looks:rows(`
古着屋の試着室|衣装を探す4人に店員が声をかけた。店の掲示板へライブの写真を貼ってくれた。
ライブ写真の焼き増し|客が友達の分まで写真を頼んだ。その友達が、次の公演に顔を出した。
雑誌へ送った写真|募集欄へ送った近況写真が小さく載った。写真で知ったという人が会場へ来た。
鏡の前で四人|衣装を揃えてみると、急にバンドらしく見えた。写真を見た人が音源にも興味を持った。
革ジャンの噂|メンバーの服をどこで買えるか聞かれた。見た目からバンドへ入る客が増えた。
髪色を覚えられる|名前はまだ知らなくても、髪の色で覚えている客がいた。次は友達を連れてきた。
駅前の写真屋|現像したライブ写真を店の人が気に入った。店頭の一枚から、4人を知る人が現れた。
顔が見えるフライヤー|小さすぎた写真を大きくした。チラシを受け取る人が、前より少し増えた。
手帳に挟んだ写真|客の手帳に、自分たちの写真が入っていた。そこから友人との話題になったらしい。
色違いの衣装|それぞれ違う色でステージに立った。誰が誰か覚えやすいと、初めての客が話した。
ライブ前の一枚|開演前に撮った写真を、客が気に入った。飾らない顔から入るファンもいる。
地下への階段|階段の壁に貼った写真を見て、初めて降りてきた客がいた。今日は音も聴いて帰った。
写真好きの客|写真を撮るために来た人が、今度は曲を聴くために来た。入り口は、4人の姿だった。
照明の色が変わる|いつもと違う照明に、4人の姿が映えた。写真を見た人から出演日の問い合わせが来た。
手作りの缶バッジ|写真を入れた缶バッジを客が作ってきた。友達にも見せていると、照れながら話した。
髪型を真似した客|見覚えのある髪型の客がいた。本人が気づくと笑い、友達も一緒に笑った。
宣材写真を選ぶ|どの写真がいいか、客に聞いてみた。選んだ写真を友達へ見せてくれた。
街角で覚えられた顔|ライブ前に立ち寄った店で、写真のバンドだと気づかれた。店員が今夜来てくれた。
写真に残る一瞬|演奏中の横顔を撮った一枚が好評だった。その一枚を見て客が増えた。
服の話から音の話へ|見た目を褒めた客が、次は曲の話をした。その人が、また友人を連れてきた。
楽屋前の記念写真|対バン相手と撮った写真から、向こうのファンも4人を知った。
名前入りのポスター|写真にそれぞれの名前を載せた。客席から、初めて名前で声をかけられた。
フライヤーの交換|別の街のバンドと写真入りのチラシを交換した。その街から客が来た。
モノクロの四人|白黒で撮った写真が、思いのほか似合った。音を知らない人まで手に取った。
窓に貼られた写真|レコード店の窓にライブ写真を貼ってもらった。通りがかった客が公演を調べた。
最後まで見ていた人|最初は見た目が気になって来たという。終わる頃には、次の曲も聴きたいと言った。
集合写真の端っこ|一人だけ妙に目立つと、客の間で話題になった。名前を調べて来る人がいた。
衣装のほころび|直した跡まで含めて格好いいと褒められた。完璧ではない姿も、客の記憶に残った。
写真の裏のサイン|頼まれて、写真の裏へ名前を書いた。大切にすると言った客が友達を連れて戻った。
地元誌のライブ欄|写真付きで掲載された。記事を見せながら受付へ来た客がいた。`),
charisma:rows(`
客席の一言から|客の冗談を拾って返した。笑った人たちが、次の曲では前へ寄ってきた。
短い自己紹介|たった十秒の紹介で、知らないバンドが気になる存在になった。
声を張らない夜|静かに客へ話すと、会場が耳を澄ました。その距離の近さが印象に残ったらしい。
失敗を隠さず|歌い出しを間違えて笑った。客も笑い、そのまま一緒にライブを楽しんだ。
最前列の合図|客が上げた手に応えた。その小さなやりとりから、客席の空気が温まった。
帰り際の握手|終演後、一人ずつ目を見て挨拶した。また来たいという客が増えた。
セットの外の魅力|曲が終わっても、4人の話を聞きたがる人がいた。ライブ全体を好きになったらしい。
借りた機材でも|慣れない機材に戸惑いながら、客へ向き直った。その姿を、客は最後まで追った。
照明が消えても|一瞬暗くなっても、声が会場をつないだ。再開すると、客が一緒に沸いた。
誰も帰らない休憩|曲間が長くなったのに、客が待ってくれた。次の一言が楽しみだったという。
即興のひとこと|目の前の出来事を歌の前に話した。その言葉で、一曲が特別になった。
出番の最後に|短く礼を言っただけなのに、拍手が長く続いた。客が次の日程を尋ねてきた。
手拍子を頼んだら|一人の手拍子が、会場へ広がった。曲を知らない客まで参加していた。
無口な主役|あまり話さないのに、客が視線を向けていた。音を出す直前の間にも引力があった。
遠慮がちな客へ|後ろにいた客へ声をかけた。少しずつ前へ来て、帰りには笑っていた。
対バンの空気まで|自分たちの出番で温まった客席が、その後も盛り上がった。共演者から礼を言われた。
本音の一言|格好をつけず、今の気持ちを話した。その言葉が客の胸に残った。
笑い合ったステージ|4人が顔を見て笑った。その雰囲気に惹かれ、また来るという客がいた。
予定より短い挨拶|長く話すのをやめ、一言だけ言った。かえってその一言が記憶に残った。
客から教わる歌|客の声に合わせて、歌い方を変えた。今夜だけのやりとりを楽しむ人がいた。
ぎこちなさも魅力|慣れない挨拶を笑われた。でもその素直さが、客の警戒をほどいた。
一人に届いた言葉|曲の前に話した言葉で、客が泣いた。その人は次に友人を連れてきた。
帰りの階段で|ステージを降りても印象が変わらなかった。少し話した客が、また来たいと言った。
視線の集まるリハ|他の出演者まで、サウンドチェックを見ていた。本番も袖から見に来た。
最後に客へ任せた|サビの一節を客へ渡した。小さな声が重なって、4人の声に戻ってきた。
声援のないところから|静かな客席へ、急がず話した。終わる頃には、自然と声が返ってきた。
ステージ袖の評判|共演者が控室でも4人の話をしていた。知り合いを次のライブへ誘ってくれた。
出番が終わってから|受付で、あのバンドをもう一度見たいという客がいた。短い時間で顔と声が残った。
言い切った約束|「次も面白くする」。その言い方を信じた客が、次のチケットを頼んだ。
歌う前の深呼吸|静かに息を吸うだけで、客がこちらを向いた。始まる前から会場の空気をつかんだ。`),
everyday:rows(`
スタジオ帰りの立ち話|入口で別のバンドと話した。今度見に行くと約束した相手が、本当に客席にいた。
フライヤーの置き場所|喫茶店の棚へチラシを置かせてもらった。それを持った客がライブへ来た。
予約の電話|友達ではない人から、チケットの予約が入った。4人は名前を何度も確認した。
アンケートの裏面|感想の紙の裏まで書いてくれた客がいた。また聴きたい曲を、4人で確かめた。
小さなファンサイト|ファンが作った紹介ページを見つけた。自分たちより詳しい曲紹介に、4人は驚いた。
雨の中、来てくれた|ひどい雨でも、いつもの客が来た。濡れたチラシを持った初めての客もいた。
隣町からの客|電車を乗り継いで来たという。「次も来たい」。その距離が、少し嬉しかった。
物販の空き箱|持ってきたデモが、前より早くなくなった。空の箱を抱えて帰るのが嬉しかった。
開演前の質問|受付で、4人の出番を確認する人がいた。待ってくれる客がいると知った。
新しいチラシの絵|手描きの絵を添えたチラシが評判だった。内容を読んでライブへ来た人がいた。
客の持ってきた友達|いつもの客が、今日は二人連れてきた。三人で同じ曲を楽しそうに聴いていた。
練習の音漏れ|スタジオの外で聴いた人が、本番の日を尋ねた。思いがけない場所で音が届いた。
友人の手作り映像|ライブを撮った映像を仲間に見せた。次の公演では、見たという人が客席にいた。
ライブ告知の電話|店の告知を聞いた客が来た。自分たちの名前を、よそで初めて耳にしたらしい。
終電前の一曲|終電に間に合うよう、最後の曲を少し早く始めた。客が礼を言い、次も来ると約束した。
忘れ物のノート|忘れたセットリストを店が保管していた。取りに行くと、次の出演も誘われた。
弦を買いに行った日|楽器店でライブの話をした。店員が常連へ、4人のチラシを渡してくれた。
店の掲示板|手書きの告知を貼った。文字だけの紙から、初めて見に来た客がいた。
出番の入れ替え|急に早い時間になったが、待っていた客がいた。短い告知でも届いていた。
感想を聞く帰り道|知り合いへ率直な感想を聞いた。褒められたところを、その人が別の友人へ話した。
初めての遠征|隣の県へ演奏に行った。まだ名前を知らない客へ、四人の音を届けた。
手作りの歌詞カード|デモに歌詞の紙を付けた。読みながら聴いた人が、ライブでも歌を覚えていた。
店の常連と相席|終演後、店の常連と話した。次の公演へ友達も呼ぶと言ってくれた。
一枚の差し入れメモ|差し入れに短い感想が添えてあった。何度も来ている客の名前を、4人は覚えた。
練習日の貼り紙|スタジオの掲示板でライブを告知した。別の部屋の利用者が聴きに来た。
同じ日に二本|昼と夜、違う場所で演奏した。疲れたが、そのぶん違う客へ音が届いた。
近所の小さな祭り|地域の催しで数曲演奏した。ライブハウスへ来たことのない人がチラシを受け取った。
最初のリクエストメモ|アンケートに曲名が書かれていた。誰かがその曲を好きだと、初めてはっきり知った。
会場の掃除を手伝う|撤収を手伝いながら店の人と話した。別の日の出演者にも紹介してもらえた。
小さな自主企画|知り合いのバンドと夜を作った。お互いの客が、知らなかった音を聴いて帰った。`)
};
function ensureChronicle(b){b.usedEventIds??=[...(b.recentEventIds||[])];b.story??={venue:pick(JAPAN_VENUES),manager:pick(['店長','佐藤店長','マスター','小林店長']),senior:pick(['THE STRAY DOGS','赤錆ロケット','VELVET CROW','夜の回路','BLACK SIGNAL','THE WANDERERS']),seeds:{},done:[],lastContinuation:-100};b.story.seeds??={};b.story.done??=[];b.story.lastContinuation??=-100;}
const MEMORY_STARTERS=rows(`
店長のひとこと|〈{venue}〉の{manager}が、終演後に声をかけた。「すぐ売れなくても、続けてみな」。その言葉を4人は覚えた。
最初の応援の手紙|ライブの感想を綴った手紙が届いた。差出人は「いつか遠くへ行っても、応援してます」と書いていた。
いつか、武道館へ|練習帰りに誰かが「いつか武道館に立とう」と言った。笑い声のあと、全員が少しだけ黙った。
先輩と並んだ夜|対バンした〈{senior}〉に演奏を褒められた。「また一緒にやろう」。その約束が嬉しかった。
一曲だけの静けさ|新しい曲を演奏した。派手な反応はなかったが、一人の客がその曲名を尋ねた。
手作りの紹介ページ|ファンが〈{band}〉の紹介ページを作った。小さな画面に、出演予定と好きな曲が丁寧に並んでいた。
遠くからの一人|遠方から来た一人の客が、帰りの時間を気にしながら最後まで聴いていた。「地元にも来てください」と言った。
厳しい常連|〈{venue}〉の常連が、今日は良くなかったと正直に言った。それでも「次も見る」と帰っていった。`);
const MEMORY_KEYS=['mentor','letter','promise','senior','quietSong','website','traveller','critic'];
function interpolateStory(b,text){return text.replaceAll('{venue}',b.story.venue).replaceAll('{manager}',b.story.manager).replaceAll('{senior}',b.story.senior).replaceAll('{band}',b.name)}
function amateurNarrative(b,gain,route){ensureChronicle(b);const stars=b.members.filter(m=>m[route]>=80);let star=stars.length&&Math.random()<.3?pick(stars):null;let pool=[...poolEntries(route,EVENT_POOLS[route]),...poolEntries('amateur-extra-'+route,AMATEUR_EXTRA[route]),...poolEntries('everyday',EVENT_POOLS.everyday),...poolEntries('amateur-extra-everyday',AMATEUR_EXTRA.everyday)];if(star)pool.push(...poolEntries('amateur-personal-'+route,PERSONAL_POOLS[route]));if(b.tick>=2&&!star)pool.push(...MEMORY_STARTERS.map((e,i)=>({...e,id:'memory-start:'+i,seed:MEMORY_KEYS[i],kind:'memoryStart'})).filter(e=>!b.story.seeds[e.seed]&&(e.seed!=='website'||calendarYear(b)>=1996)));const e=freshEvent(b,pool);let text=interpolateStory(b,e.text).replaceAll('{name}',star?.name||'').replaceAll('{role}',star?.role||'');if(star?.role==='Vo'&&route==='skill')text=text.replaceAll('演奏','歌声').replaceAll('手元','歌い方').replaceAll('楽器を買った','歌を始めた').replaceAll('鳴らした音','響かせた声').replaceAll('の腕','の歌声');return {...e,text,gain,label:'LIVE HOUSE DAYS',eventId:e.id,popularityRoute:e.id.startsWith('everyday')||e.id.startsWith('amateur-extra-everyday')||e.seed?null:route,spotlightMember:e.id.startsWith('amateur-personal')&&star?b.members.indexOf(star):null};}
function rememberDisplayedEvent(b,e){ensureChronicle(b);if(e.seed&&!b.story.seeds[e.seed]){const song=e.seed==='quietSong'?addSong(b,null,200):null;b.story.seeds[e.seed]={tick:b.tick,title:e.title,songId:song?.id||null};if(song)e.text+='\n曲名は『'+song.title+'』。';}if(e.kind==='first')b.story.seeds.firstVenue??={tick:b.tick,title:e.title};if(e.kind==='opening')b.story.seeds.opening??={tick:b.tick,title:e.title};}
function continuationEvent(b,forced=null){ensureChronicle(b);if(b.tick-b.story.lastContinuation<6&&!forced)return null;const s=b.story.seeds;const elapsed=k=>s[k]&&b.tick-s[k].tick>=6;let choices=[];
const add=(key,condition,title,text,rate=0,base=0)=>{if(condition&&!b.story.done.includes(key))choices.push({key,title,text,gain:base?scaledFans(b,rate,base):0});};
add('venue-return',elapsed('firstVenue')&&b.tick>=12,'最初の店へ戻る','初ライブの場所、〈{venue}〉へ戻ってきた。あの日より落ち着いて、4人は同じステージに立った。');
add('three-return',elapsed('threeFans')&&b.tick>=12,'あの日の3人','初ライブで聴いてくれた3人が、今日も客席にいた。「最初から見てるよ」。その言葉に、4人は笑った。');
add('three-big',elapsed('threeFans')&&b.pro&&b.specialEvents.includes('budokan'),'最前列の、あの3人','武道館まで来てくれた、初ライブの3人。客席の広さは変わっても、4人を見る顔はあの日のままだった。');
add('mentor-thanks',elapsed('mentor')&&b.pro,'店長へ、デビューの報告','〈{venue}〉の{manager}へ、プロになったと報告した。「だから言ったろ」。照れた声が、電話の向こうから返ってきた。');
add('mentor-still',elapsed('mentor')&&!b.pro&&b.tick>=36,'まだ、やってるか','〈{venue}〉の{manager}が、久しぶりに4人のライブを見た。「前よりいい音になったな」。売れなくても、続けた時間は届いていた。');
add('letter-reply',elapsed('letter'),'手紙の返事','昔もらった応援の手紙を読み返した。4人で返事を書くと、差出人は次のライブへ友達を連れてきてくれた。',.015,30);
add('letter-big',elapsed('letter')&&b.pro&&b.fans>=100000,'遠くへ行っても','売れる前に手紙をくれた人から、また便りが届いた。「遠くへ行っても応援するって、書いたでしょう」。あの約束は続いていた。');
add('promise-real',elapsed('promise')&&b.specialEvents.includes('budokan'),'あの冗談が、本当になった','武道館の客席を見渡した。練習帰りの冗談を、全員が覚えていた。「本当に来ちゃったな」。今度は誰も笑わなかった。');
add('senior-festival',elapsed('senior')&&b.pro&&b.festivalHistory.length>0&&b.fans>=20000,'同じフェスで、また会った','〈{senior}〉とフェスで再会した。昔の対バンの話をしてから、互いのステージを見に行った。',.025,200);
add('senior-local',elapsed('senior')&&!b.pro&&b.tick>=18,'また一緒にやろう','〈{senior}〉から対バンの誘いが来た。前に会った頃の話を笑いながら、4人は新しい曲を聴かせた。',.015,40);
add('opening-reunion',elapsed('opening')&&b.pro&&b.festivalHistory.length>0&&b.fans>=30000,'前座だった4人と、再会','昔、前座を任せてくれた〈{senior}〉と同じフェスへ。「覚えてるよ」。今度は、自分たち目当ての客も待っている。',.04,500);
add('website-archive',elapsed('website')&&b.pro,'あのページは、まだある','下積みの頃の紹介ページが、今も更新されていた。最初の写真と今の出演予定が、同じ画面に並んでいる。');
add('website-friends',elapsed('website')&&!b.pro&&b.tick>=18,'ページを見て来ました','昔ファンが作った紹介ページを見て、客がやってきた。目立たないところでも、4人の音はつながっていた。',.01,30);
add('traveller-tour',elapsed('traveller')&&b.pro&&b.fans>=20000,'やっと、その街へ','昔「地元にも来て」と言った客の街で公演した。終演後、その人が「待ってた」と声をかけた。',.02,250);
add('critic-nod',elapsed('critic')&&b.tick>=18,'厳しかった、あの人','〈{venue}〉の常連が、今日は黙ってうなずいた。何年も見てきた人の短い「よかった」が、妙に嬉しかった。');
const quiet=s.quietSong&&b.songs.find(x=>x.id===s.quietSong.songId);add('quiet-grown',elapsed('quietSong')&&!!quiet&&b.tick-quiet.firstTick>=18,'あの曲を、もう一度','最初は目立たなかった『'+(quiet?.title||'')+'』を演奏した。長く聴いてきた客が歌い、新しい客が曲名を尋ねた。',.025,100);
if(forced)choices=choices.filter(e=>e.key===forced);if(!choices.length)return null;const e=pick(choices);b.story.done.push(e.key);b.story.lastContinuation=b.tick;if(e.key==='quiet-grown'&&quiet){quiet.appeal+=Math.max(300,e.gain*5);quiet.cultFavorite=true;}return {...e,text:interpolateStory(b,e.text),label:'THE STORY CONTINUES',kind:'continuation'};}
function closingCallback(b){ensureChronicle(b);const s=b.story.seeds;if(s.promise&&b.specialEvents.includes('budokan'))return 'かつて練習帰りに口にした武道館の夢は、この4人で叶えた。';if(s.threeFans&&b.fans>=3)return '初ライブの3人から始まった時間を、4人は最後まで忘れなかった。';if(s.mentor)return interpolateStory(b,'〈{venue}〉の{manager}へも、最後に解散を報告した。「お疲れさん」。あの日と同じ声だった。');if(s.promise)return '練習帰りに話した武道館の夢は叶わなかった。それでも、4人で鳴らした音は残った。';if(s.letter)return '最後の夜にも、昔もらった応援の手紙を持ってきた。4人は読み返してから、ステージへ向かった。';return '';}

function openingChoice(key,choices){let recent=[];try{recent=JSON.parse(localStorage.getItem('band-yaro-ze-opening-'+key))||[]}catch{}const value=x=>typeof x==='string'?x:x.title;const unseen=choices.filter(x=>!recent.includes(value(x)));const choice=pick(unseen.length?unseen:choices.filter(x=>value(x)!==recent.at(-1)));try{localStorage.setItem('band-yaro-ze-opening-'+key,JSON.stringify([...recent,value(choice)].slice(-Math.min(10,choices.length-1))))}catch{}return choice;}
