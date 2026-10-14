/* v23: title draws use a separate stream and cannot alter the generated lyrics. */
const SONG_TITLE_THEMES={
'衝動':[['今すぐ','まだ熱い','速度の外','止まらない朝','火を持って','先へ','未完成の加速','息より早く'],['Right Now','Still Hot','Outside the Speed','Morning in Motion','Carrying Fire','Further','Unfinished Acceleration','Before the Breath']],
'恋の始まり':[['砂糖はいくつ','聞き返す距離','名前を呼ぶ前に','隣まで','あと一口','少しだけ近く','言えない温度','君のぶん'],['How Much Sugar','Close Enough to Ask','Before Your Name','Beside You','One More Sip','A Little Closer','An Unspoken Warmth','Your Share']],
'欲望と誘惑':[['もう少し欲しい','甘い傷','手の届く夜','満たされる前に','熱の置き場','まだ足りない','赤い余白','触れたあと'],['A Little More','Sweet Bruise','A Night Within Reach','Before Enough','A Place for Heat','Not Enough Yet','Red Margin','After the Touch']],
'嫉妬と執着':[['数えなくていい','知らない名前','ほどけない','君のいない話','鏡の向こう側','答えを待つ指','遠い隣','まだ消せない'],['No Need to Count','An Unknown Name','Still Tangled','A Story Without You','Across the Mirror','Fingers Awaiting an Answer','The Distant Seat Beside Me','Not Erased Yet']],
'楽しい日常':[['今日のぶん','何でもない午後','寄り道日和','半分こ','予定なし','そのまま笑って','少し焦げた朝','いつもの角'],['For Today','An Ordinary Afternoon','A Day for Detours','Half for You','No Plans','Keep Laughing','A Slightly Burnt Morning','The Usual Corner']],
'生活への違和感':[['この線の外','誰の正解','合わない形','値札の裏','隣の歯車','俺の寸法','違う色で','小さな否定'],['Outside This Line','Whose Answer','A Shape That Will Not Fit','Behind the Price Tag','The Other Cogwheel','My Own Measure','Another Color','A Little No']],
'自信と挑戦':[['俺の歩幅','まだやれる','一歩の重さ','声を引くな','ここから先','自分の返事','足りなくても','今日の一音'],['My Own Stride','More to Give','The Weight of One Step','Keep Your Voice','From Here','My Own Answer','Even Without Enough','One Note Today']],
'迷いと不安':[['決めない朝','鍵はある','問いのまま','地図の途中','震えていても','空の封筒','答えを急がない','どこへ帰ろう'],['An Undecided Morning','There Is a Key','Still a Question','Halfway Through the Map','Even While Shaking','An Empty Envelope','No Hurry for an Answer','Where to Return']],
'記憶と郷愁':[['読みかけの季節','あの日の匂い','古い取っ手','忘れた色','覚えている道','まだ温かい','遠くなる午後','折り目の奥'],['A Season Half-Read','The Scent of That Day','The Old Handle','A Forgotten Color','The Road I Remember','Still Warm','An Afternoon Receding','Inside the Fold']],
'そばにいる人への感謝':[['君のいる場所','残してくれた椅子','分けた光','待っていた時間','名前より先に','小さな借り','もう一杯','何も言わずに'],['Where You Are','The Chair You Kept','Shared Light','The Time You Waited','Before a Name','A Little Debt','Another Cup','Without a Word']],
'寓話と幻想':[['空気の標本','白い雑音','逆さまの庭','夜の鱗','名前のない色','水槽の外','眠る歯車','色の行方'],['A Sample of Air','White Noise','An Upside-Down Garden','Scales of Night','A Nameless Color','Outside the Tank','A Sleeping Gear','Where Colors Go']],
'喪失と再出発':[['空いた場所から','残った手','続きの朝','軽くなった鞄','違う帰り道','捨てなかった音','片方のままで','窓を開ける日'],['From the Empty Place','The Hand That Remains','The Following Morning','A Lighter Bag','Another Way Home','The Sound I Kept','With One Half','The Day I Open the Window']]
};
const SONG_TITLE_SHORT_FORMS={
'読みかけのままの季節':'読みかけの季節','書き直したあとの余白':'余白の向こう','聞き返す距離にいてくれよ':'聞き返す距離','氷が溶けるまでの秘密':'氷が溶けるまで','ガラス越しに冷えた夢':'ガラス越しの夢','畦道で聞いた沈黙':'畦道の沈黙','土を落としたあとの重さ':'土の重さ','小さな声の置き場':'小さな声','言いかけた声を最後まで出す':'言いかけた声','同じ窓から違う雨を見る':'違う雨','誰かの遅さで夕陽が変わる':'遅い夕陽','雨上がりの鉄の匂い':'雨上がりの鉄','The space between our words':'Between Our Words','the space between our words':'Between Our Words','the quiet after the lamp goes out':'After the Lamp Goes Out','the summer words I never said':'Summer Words','a season left half-read':'Half-Read','a blue without a name':'Nameless Blue','a promise that will not dry':'The Undried Promise','the road that will not settle':'The Unsettled Road'
};
function composeSongTitle(seed,lyrics,theme,mode,context){
 const r=lyricRandom(seed+':title-v2'),lang=['english','en-jp-hook'].includes(mode)?'english':'jp',pick=a=>a[Math.floor(r()*a.length)],unique=a=>[...new Set(a)],clean=s=>s.trim(),fits=s=>lang==='jp'?/[ぁ-んァ-ヶ一-龠]/u.test(s)&&s.length<=26:!/[ぁ-んァ-ヶ一-龠]/u.test(s)&&s.length<=76;
 const lines=unique(lyrics.split('\n').filter(s=>s&&!s.startsWith('[')).flatMap(s=>s.split(/　| — /)).map(clean).filter(fits));
 const nouns=unique(['subjects','targets'].flatMap(slot=>LYRIC_PARTS.words[lang][slot].filter(x=>lyrics.includes(x)&&lyricAllowed(LYRIC_PARTS.wordMeta[lang+'|'+slot+'|'+x],context))));
 const shorts=unique(Object.entries(SONG_TITLE_SHORT_FORMS).filter(([key,value])=>lyrics.includes(key)&&fits(value)).map(([,value])=>value));
 const bank=SONG_TITLE_THEMES[theme]?.[lang==='jp'?0:1]||[lang==='jp'?'まだ名前はない':'Not Named Yet'];
 const readable=s=>lang==='english'?s.replace(/^(?:a|an|the)\s+/i,'').replace(/^./,c=>c.toUpperCase()):s;
 const noun=()=>readable(pick(nouns.length?nouns:bank));
 const roll=r()*100;let title,type;
 if(roll<34){title=noun();type='phrase';}
 else if(roll<58){title=lines.length?pick(lines):noun();type='lyric-line';}
 else if(roll<74){title=shorts.length?pick(shorts):noun();type='short-form';}
 else if(roll<86){const a=noun(),options=nouns.map(readable).filter(x=>x!==a),b=options.length?pick(options):null;title=b?(lang==='jp'?a+'と'+b:a+' & '+b):a;type='paired';if(title.length>(lang==='jp'?30:85))title=a;}
 else if(roll<95){title=pick(bank);type='theme';}
 else{const a=noun(),options=nouns.map(readable).filter(x=>x!==a),b=options.length?pick(options):pick(bank);title=a+' / '+b;type='slash';}
 return {title:lang==='english'?title.replace(/^./,c=>c.toUpperCase()):title,type};
}
