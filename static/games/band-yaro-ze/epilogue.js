/* v13: 300万人の殿堂入り / イメチェン / 能力と経歴に沿う後日談 */
const HALL_FANS=3000000;
function isHallBand(b){return !!b&&(b.hallOfFame===true||(b.maxFans||0)>=HALL_FANS);}
function markHallBand(b){if(isHallBand(b)){b.bandTitles??=[];b.hallOfFame=true;b.hallTick??=b.tick;if(!b.bandTitles.includes('殿堂入りバンド'))b.bandTitles.push('殿堂入りバンド');}return b;}
function syncHallCollection(d){d.history??=[];d.hall??=[];for(const b of d.history){if(isHallBand(b)){ensureLife(b);markHallBand(b);if(!d.hall.some(h=>h.id===b.id))d.hall.push(JSON.parse(JSON.stringify(b)));}}return d;}
const v12Step=stepBand;
stepBand=function(b){const before=isHallBand(b),e=v12Step(b);markHallBand(b);if(e&&!before&&isHallBand(b)){b.history.push({tick:b.tick,title:'300万人達成、殿堂入り',text:'最大ファン数300万人に到達。〈'+b.name+'〉は殿堂入りバンドとして名を刻んだ。',kind:'hall'});e.hallDebut=true;e.text+='\n\n最大ファン数300万人達成。殿堂入りの記録に、この4人の名が刻まれた。';}return e;};
const v12BandTitles=displayBandTitles;
displayBandTitles=function(b){const titles=v12BandTitles(b);return isHallBand(b)?[...new Set(['殿堂入りバンド',...titles])]:titles;};
function makeoverEvent(b,index=null){if(b.tick<4||b.tick-(b.makeovers?.at(-1)?.tick??-100)<12)return null;const i=index??rand(0,3),m=b.members[i],before={...m.face},kind=pick(['hair','clothes','both']);if(kind!=='clothes')m.face.hair=(m.face.hair+rand(1,3))%4;if(kind!=='hair')m.face.clothes=(m.face.clothes+rand(1,3))%4;const after={...m.face},hair=['短髪','ロングヘア','モヒカン','坊主頭'],clothes=['革ジャン','Gジャン','パンク風の服','ランニング'];let text=kind==='both'?hair[after.hair]+'と'+clothes[after.clothes]+'。':kind==='hair'?hair[before.hair]+'から'+hair[after.hair]+'へ。':clothes[before.clothes]+'を脱ぎ、'+clothes[after.clothes]+'で現れた。';text+='\n'+pick(['鏡の前では照れていたが、仲間の前では得意顔だ。','残る3人が二度見した。「誰かと思ったぞ」。','いつもの音なのに、見慣れた姿が少し違う。','「気分を変えたかっただけ」。本人は笑っている。','最初は落ち着かなかったが、すぐに自分の姿になった。','久しぶりに会った知り合いが、名前を呼ぶ前に足を止めた。']);b.makeovers??=[];b.makeovers.push({tick:b.tick,member:i,before,after});return {title:m.name+'、イメチェン！',text,gain:0,label:'A NEW LOOK',kind:'makeover',member:i,makeover:{before,after}};}
const v12Special=v10SpecialEvent;
v10SpecialEvent=function(b){const e=v12Special(b);if(e)return e;return Math.random()<.025?makeoverEvent(b):null;};
// 進路を決める入口を増やす。同じ進路でも実績・人柄・家庭で後日談を変える。
const AFTER_PATHS=[];
function afterRows(group,content){for(const line of content.trim().split('\n')){const [id,job,text]=line.split('|');AFTER_PATHS.push({id,group,job,text});}}
afterRows('voice',`
solo|ソロシンガー|自分の名で歌を届ける道を選んだ。バンドとは違う編成で、声そのものに向き合っている。
enka|演歌歌手|思い切って演歌へ転向した。歌詞の一言に感情を込める歌い方を学び直し、地方巡業から歩き始めた。
musical|ミュージカル俳優|歌声を舞台で生かす道へ進んだ。台詞と踊りも学び、物語の中で歌うようになった。
voicecoach|歌唱指導者|声を聴き、歌手の悩みをほどく仕事を始めた。歌い方を押しつけず、それぞれの声を引き出している。
cmvoice|CMソング歌手|名前より先に、声が街へ届くようになった。テレビCMや番組の短い歌を、確かな技術で歌い分けている。
chorus|コーラス歌手|主役の声を支える歌手になった。ハーモニーを作る楽しさを知り、録音やツアーの現場に立っている。
soul|ソウルシンガー|ソウルやブルースの歌い方に惹かれ、小さな店で歌い直した。派手な経歴より、声の深さで客を迎えている。
folk|弾き語り歌手|ギター一本で歌うようになった。四人分の音がない静けさの中で、言葉をひとつずつ届けている。
localradio|歌うラジオ司会者|地元のラジオで話し、番組の最後には歌う。声を聴いて、バンド時代を思い出すリスナーもいる。`);
afterRows('instrument',`
studio|スタジオミュージシャン|録音の仕事へ進んだ。一度で求められた音を出す腕を磨き、さまざまな作品の中で音を鳴らしている。
support|サポートミュージシャン|ほかのアーティストの公演を支える道を選んだ。主役が気持ちよく演奏できるよう、音でステージを組み立てる。
jazz|ジャズミュージシャン|ジャズへ進み、即興の会話を学び直した。小さな店で、その夜だけの演奏を重ねている。
overseasband|海外バンドのメンバー|海外のバンドから誘いを受けた。言葉の違いに戸惑いながらも、音を合わせることで仲間になった。
instrumentcoach|楽器講師|楽器を教える仕事を始めた。つまずく生徒の手を見ながら、自分にも弾けなかった日があったことを話す。
demonstrator|楽器メーカーの実演奏者|楽器メーカーの実演担当になった。新しい機種の音を聴かせるたび、足を止める人が増えている。
theatreband|劇場の楽団員|劇場の楽団へ入り、毎夜の物語を音で支える。舞台に合わせて演奏を変える仕事が、性に合っていた。
instrumentmaker|楽器工房の職人|演奏する手を、楽器を作る手にも変えた。木や金属と向き合い、弾く人の癖まで考えた一本を仕上げる。
sessionhost|セッションの世話役|街のセッションを開くようになった。初心者も古参も混ざる夜を、演奏しながらまとめている。
fusion|フュージョン奏者|新しい奏法と複雑な曲に取り組んだ。派手な名声より、音を突き詰める仲間との演奏を選んだ。`);
afterRows('looks',`
actor|俳優|演じる仕事へ進んだ。台詞や立ち姿を学び、音楽とは違う役柄で自分の居場所を作っている。
model|モデル|写真の中で表現する仕事を始めた。服や照明で変わる自分の姿を、ひとつの作品として届けている。
stageactor|舞台俳優|客席の前に立つ経験を、演劇へ持っていった。小さな舞台から、台詞と体で物語を伝えている。
talent|タレント|番組やイベントへ出演するようになった。ステージの外で見せる素顔が、新しい仕事につながった。
localad|地元広告のモデル|地元の広告や観光案内に登場するようになった。商店街で写真を見かけ、昔の仲間が笑っている。
fashion|服飾ブランドの顔|服飾ブランドと仕事を始めた。音楽時代の着こなしを、自分らしい表現へ育てている。
filmextra|映画の脇役|映画の小さな役から演技を学んだ。短い出番でも印象を残すよう、現場へ通い続けた。
idol|アイドルとして再出発|別のステージで歌い踊る道を選んだ。新しい振付に苦戦しながら、もう一度新人として歩き始めた。`);
afterRows('charisma',`
newband|新バンドの中心人物|新しい仲間を集め、別の名前で音を鳴らし始めた。今度のバンドにも、その人の周りから人が集まっている。
radio|音楽番組の司会者|音楽を紹介する番組を持った。知らない曲にも興味を持たせる話し方が、リスナーに親しまれている。
eventhost|イベント司会者|イベントを進める仕事を始めた。客席と出演者の間をつなぎ、場の空気を動かしている。
entrepreneur|実業家|音楽の外で事業を始めた。人を巻き込み、仕事を形にする力を、次の世界で試している。
politician|政治家|地元の人の声を聞き、選挙に挑戦した。音楽の舞台を離れ、政策と対話で支持を得る道へ進んだ。
religion|宗教家|独自の思想を語るようになった。その言葉を聞く人が集まり、宗教団体を率いる道へ進んだ。
clubowner|ライブハウス経営者|ライブハウスを開いた。出演者にも客にも声をかけ、街の音楽が集まる場所を作っている。
bookauthor|音楽エッセイスト|音楽の経験を文章にした。豪華な舞台より、楽屋で起きた小さな出来事に読者が引きつけられた。`);
afterRows('cooperation',`
mentor|若手バンドの育成者|若いバンドの相談役になった。曲だけでなく、四人で続ける難しさも、自分の経験から伝えている。
tourmanager|ツアーマネージャー|公演の段取りと人間関係を支える仕事を始めた。疲れた出演者の話を聞き、次の街へ送り出す。
community|地域音楽活動の世話役|地域の音楽活動を支えるようになった。年齢も腕も違う人が、一緒に演奏できる場所を作っている。
schoolowner|音楽教室の運営者|講師や生徒が安心して通える音楽教室を作った。人を支える仕事に、バンド時代の気配りが生きている。
shopkeeper|仲間が集まる店の主人|小さな店を開いた。元メンバーや後輩がふらりと寄り、閉店後に音楽の話が始まる。
roadcrew|舞台裏のスタッフ|演奏する側から支える側へ移った。誰かの困りごとに先に気づく人として、現場に欠かせない存在になった。
agent|音楽事務所の相談役|音楽事務所で若手の活動を支えるようになった。売れることと、無理なく続けることの両方を考えている。`);
afterRows('solitary',`
homeartist|自宅録音の音楽家|一人で録音し、作品を出す道を選んだ。人と合わせる難しさから離れ、自分の音を最後まで作り込んでいる。
soloartisan|独立した職人|組織を離れ、一人で請け負う仕事を始めた。人付き合いは少ないが、仕上がりを頼りに仕事が届く。
wandering|転々とする音楽家|新しい現場でも意見がぶつかり、長くは留まれなかった。それでも音を出せる場所を探し続けている。
fractured|新バンドでも衝突|新しいバンドを始めたが、また話し合いがこじれた。今回は、自分が譲れなかったことも少し見えてきた。
independent|孤高の自主制作家|誰にも指図されず、自主制作を続けた。万人受けはしないが、その頑固な作品を待つ人がいる。`);
afterRows('ordinary',`
office|会社員|音楽を生活の中心から外し、会社で働く道を選んだ。仕事帰りに昔の曲を聴く時間は、今も残っている。
familybusiness|家業を継ぐ|地元へ戻り、家の仕事を継いだ。店の奥には、四人で写った一枚の写真が飾られている。
craft|職人|手を動かす仕事に就いた。毎日少しずつ上達する感覚が、昔の練習に似ていると気づいた。
cafe|喫茶店の店主|喫茶店を開いた。店で流す曲には、若い頃に何度も聴いたレコードが混ざっている。
restaurant|飲食店で働く|飲食の仕事へ進んだ。忙しい夜を仲間と乗り切ると、ライブが終わった日の気分を思い出す。
hobbyband|週末だけのバンドマン|仕事をしながら、週末には音を合わせる。売れるためではなく、また会うためのバンドになった。
recordshop|中古レコード店員|中古レコード店で働き始めた。客に一枚を薦めるとき、ついバンド時代の話が長くなる。
familylife|家庭を大切にする暮らし|音楽との距離を変え、身近な人と過ごす時間を選んだ。昔の機材は、必要なときに出せるよう残してある。
repair|機材修理の仕事|機材を直す仕事を覚えた。壊れたアンプが再び鳴る瞬間を、今の楽しみにしている。
farmer|地元で農業|地元で農業を始めた。季節に合わせて働く暮らしの中で、ときどき昔のメロディーを口ずさむ。`);
afterRows('wealthy',`
heir|家業の役員|家の事業へ入り、経営を学ぶ道を選んだ。音楽活動で会った人たちとの縁も、仕事の外で続いている。
richlabel|音楽レーベルの創設者|家の資金と音楽の経験を生かし、レーベルを立ち上げた。若いバンドの最初の作品を支えている。
richstudio|録音スタジオの経営者|家の支援で録音スタジオを作った。設備を揃えるだけでなく、演奏者が安心できる場所を目指している。
richvenue|ライブハウスのオーナー|家の資金を使ってライブハウスを開いた。自分が主役になるより、新しいバンドの夜を見守っている。
richinvestor|音楽を支える投資家|家の事業に関わりながら、音楽の企画へ出資するようになった。若い才能が動き出す場所を作っている。
richfashion|服飾事業の経営者|家の支援を得て服飾の事業を始めた。バンド時代の着こなしを、仕事の発想に変えている。
richfoundation|音楽支援財団の運営者|家の資金を音楽支援に回した。楽器や練習場所に困る若者へ、最初の一歩を用意している。
richshop|小さな楽器店主|家の事業を継ぐ話もあったが、自分の店を持つ道を選んだ。初心者と音楽の話をする毎日を楽しんでいる。`);
function afterWeight(p,m,b,i){const famous=(b?.maxFans||0)>=100000,huge=(b?.maxFans||0)>=1000000||b?.worldCareer?.stage>=2||b?.specialEvents?.includes('dome');const minimum=huge?55:famous?65:75;const solo=b?.memberCareers?.[i]?.some(l=>l.key==='solo');switch(p.group){case'wealthy':return m.background==='wealthy'?4:0;case'voice':return m.role==='Vo'&&m.skill>=minimum?(m.skill-40)/15+(solo&&p.id==='solo'?4:0):0;case'instrument':return m.role!=='Vo'&&m.skill>=minimum?(m.skill-40)/15:0;case'looks':return m.looks>=minimum?(m.looks-40)/18:0;case'charisma':if(m.charisma<minimum)return 0;if(p.id==='politician')return m.charisma>=80?.3:0;if(p.id==='religion')return m.charisma>=85?.22:0;return (m.charisma-40)/18;case'cooperation':return m.cooperation>=75?(m.cooperation-60)/10:0;case'solitary':return m.cooperation<=25?(p.id==='homeartist'&&m.skill<55?0:2):0;default:return m.background==='wealthy'?0:huge?.09:famous?.25:1.6;}}
contextualAftermath=function(m,b=null,index=null){if(!b?.members)b=null;const i=index??(b?.members?.indexOf(m)??0);if(b){ensureEnsemble(b);if(i===0)b.afterUsed=[];b.afterUsed??=[];}const huge=(b?.maxFans||0)>=1000000||b?.worldCareer?.stage>=2||b?.specialEvents?.includes('dome');let candidates=AFTER_PATHS.map(p=>({p,w:afterWeight(p,m,b,i)})).filter(x=>x.w>0);const unused=candidates.filter(x=>!b?.afterUsed?.includes(x.p.id));if(unused.length)candidates=unused;let r=Math.random()*candidates.reduce((s,x)=>s+x.w,0),chosen=candidates.at(-1)?.p;for(const x of candidates){r-=x.w;if(r<=0){chosen=x.p;break;}}let job=chosen.job,text=chosen.text,rare=false;let summary=huge&&chosen.group==='ordinary'?'音楽の誘いもあったが、自ら生活を変える道を選んだ。':null;
if(m.cooperation<=10&&Math.random()<.015){const bad=pick([{job:'契約トラブルで活動停止',text:'独立後に契約を巡る争いが起きた。周囲との話し合いもこじれ、活動を止めて問題に向き合うことになった。'},{job:'事業の不祥事で失脚',text:'音楽の外で始めた事業に不祥事が発覚した。支えていた人も離れ、表舞台から退くことになった。'},{job:'事件の後、生活を立て直す',text:'周囲との衝突を重ねるうち、傷害事件を起こしてしまった。責任を負い、支援を受けながら生活を立て直す道を歩いている。'}]);job=bad.job;text=bad.text;summary=null;rare=true;}
else if(chosen.id==='politician'&&m.charisma>=90&&m.cooperation>=70&&Math.random()<.025){job=Math.random()<.12?'内閣総理大臣':'国務大臣';text=job==='内閣総理大臣'?'地方での政治活動から国会へ進んだ。長い年月を経て党を率い、ついに内閣総理大臣に就任。就任会見で、若い頃のバンド活動を尋ねられた。':'政治の世界で経験を積み、やがて国務大臣に就任した。昔の音楽仲間が、ニュースの中にその顔を見つけた。';rare=true;}
else if(chosen.id==='enka'&&Math.random()<.12){job=huge||m.skill>=95?'演歌のヒット歌手':'遅咲きの演歌歌手';text+='\n長い巡業の末、歌が大きなヒットに。紅白歌合戦の舞台へ、今度は演歌歌手として立った。';rare=true;}
else if(chosen.id==='solo'&&m.skill>=95&&Math.random()<.08){job='ソロで大ヒット';text+='\n自分の名で出した一曲が大ヒット。バンド時代を知らない世代まで、その歌を口ずさんだ。';rare=true;}
if(b?.instantEndEvent)text='結成の日に別れた後、'+text;else if(b?.worldCareer?.stage>=2)text='世界ツアーを経験した一人として、'+text;else if(huge)text='大きな舞台を経験した後、'+text;
if(summary)text+='\n'+summary;
if(!rare&&m.cooperation>=75)text+='\n'+pick(['人の話をよく聞く姿勢は変わらず、新しい場所でも仲間に慕われた。','困った人に声をかける癖は、次の仕事でも生きている。','元メンバーとも連絡を取り合い、節目には一緒に食事をしている。','後輩から相談が届くと、時間を作って話を聞いている。']);
else if(!rare&&m.cooperation<=25)text+='\n'+pick(['人と合わせる難しさは残った。それでも、自分に合う距離を探している。','仕事相手とはときどき衝突するが、少しずつ折り合いのつけ方を覚えている。','大勢の輪からは離れ、少数の気の合う人との暮らしを選んだ。']);
else if(!rare)text+='\n'+pick(['昔の曲を聴くと、四人で過ごした時間がよみがえる。','古い写真は捨てずに残した。あの日の自分も、今の人生の一部だ。','忙しい日にも、好きな音楽を聴く時間だけは残している。','偶然会った昔の客と、ライブの思い出を話すことがある。','機材を片づけても、身についたリズムは消えなかった。']);
if(b?.memberCareers?.[i]?.some(l=>l.key==='solo'))text+='\nバンド時代のソロ活動で得た経験も、今の道の一部になっている。';const family=b?.family?.[i];if(family?.children?.length)text+='\n子どもたちには、若い頃に四人で音を鳴らした話をしている。';if(family?.married&&family.partner)text+='\n'+family.partner.name+'との暮らしも、次の人生を支えている。';if(b?.members&&relationshipProfile(b).mediator===i)text+='\n今も元メンバー3人と別々に連絡を取り続けている。';if(b?.ensembleFlags?.includes('cult'))text+='\nあのバンドを覚えている少数のファンは、今も活動を追いかけている。';if(b)b.afterUsed.push(chosen.id);return {job,text,summary,path:chosen.id,rare};};
