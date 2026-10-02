const fs=require('fs');
function env(file){const b=fs.readFileSync(file);const a=new Float32Array(b.buffer,b.byteOffset,b.length/4);
const fps=24,hop=24000/fps,out=[];for(let i=0;i*hop<a.length;i++){let s=0;for(let j=i*hop;j<(i+1)*hop&&j<a.length;j++)s+=a[j]*a[j];out.push(Math.sqrt(s/hop));}
const mx=out.slice().sort((x,y)=>x-y)[Math.floor(out.length*0.98)];return out.map(v=>+Math.min(1,v/mx).toFixed(3));}
const e=env('pcm.raw');fs.writeFileSync('env.js.json',JSON.stringify(e));
let line='';for(let s=0;s<210;s+=2){const seg=e.slice(s*24,(s+2)*24);const m=seg.reduce((a,b)=>a+b,0)/seg.length;line+=`${s}:${m.toFixed(2)} `;}console.log(line);
