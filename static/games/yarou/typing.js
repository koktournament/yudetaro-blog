// Milliseconds between characters. Punctuation leaves a small breath in spoken passages.
export function characterDelay(char,speedIndex=0){
 const base=speedIndex===1?18:30;
 if(speedIndex===2)return 0;
 if(/[。！？]/.test(char))return base*6;
 if(char==='\n')return base*4;
 if(/[、，]/.test(char))return base*2;
 return base;
}
