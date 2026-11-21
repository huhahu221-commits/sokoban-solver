import{mkdirSync as M,readdirSync as E,readFileSync as F,writeFileSync as W}from'node:fs';
const I=process.env.MAKEFUN_INPUT_DIR||'/input',O=process.env.MAKEFUN_OUTPUT_DIR||'/output';
const V=[[0,-1,'u'],[0,1,'d'],[-1,0,'l'],[1,0,'r']];
const A=(L,c,d)=>{let x=c%L.w+d[0],y=(c-c%L.w)/L.w+d[1];return x<0||y<0||x>=L.w||y>=L.h?-1:y*L.w+x};
const P=t=>{let r=t.split('\n').filter(Boolean),h=r.length,w=Math.max(...r.map(s=>s.length)),f=new Set,g=new Set,b=[],p=0;
for(let y=0;y<h;y++)for(let x=0;x<w;x++){let c=r[y][x]||'#',i=y*w+x;if(c=='#')continue;f.add(i);
if('.*+'.includes(c))g.add(i);if('$*'.includes(c))b.push(i);if('@+'.includes(c))p=i}
return{w,h,f,g,b:b.sort((a,b)=>a-b),p}};
const Q=L=>{let hy=(L.p/L.w)|0,se=new Set,out=[];
for(let s of L.f){if(se.has(s)||(s/L.w|0)==hy)continue;let a=new Set([s]),q=[s];se.add(s);
for(let i=0;i<q.length;i++){let c=q[i];for(let d of V){let n=A(L,c,d);
if(n<0||se.has(n)||!L.f.has(n)||(n/L.w|0)==hy)continue;se.add(n);a.add(n);q.push(n)}}
let porch=s;
for(let c of a){let x=c%L.w,y=(c-x)/L.w,ty=y<hy?y+1:y-1;
if(ty==hy&&L.f.has(hy*L.w+x)){porch=hy*L.w+x;break}}
a.add(porch);out.push({a,porch,hy,bx:L.b.filter(b=>a.has(b)&&(b/L.w|0)!=hy)})}
return out};
const S=(L,a,porch,hy,start)=>{let goals=new Set;for(let x of L.g)if(a.has(x))goals.add(x);
let at=(p,b)=>p+'|'+b.join(','),done=(p,b)=>p==porch&&b.every(x=>goals.has(x));
let B=[[{p:porch,b:start,par:null,mv:''}]],seen=new Set([at(porch,start)]);
for(let d=0;d<B.length;d++){let q=B[d];
for(let h=0;h<q.length;h++){let s=q[h];
if(done(s.p,s.b)){let o='',k=s;while(k.par){o=k.mv+o;k=k.par}return o}
let bs=new Set(s.b);
for(let dd of V){let n=A(L,s.p,dd);if(n<0||!a.has(n))continue;
if(bs.has(n)){let t=A(L,n,dd);if(t<0||!a.has(t)||(t/L.w|0)==hy||bs.has(t))continue;
let nb=s.b.slice(),k=nb.indexOf(n);nb[k]=t;nb.sort((a,b)=>a-b);let key=at(n,nb);
if(seen.has(key))continue;seen.add(key);(B[d+1]||(B[d+1]=[])).push({p:n,b:nb,par:s,mv:dd[2]});
}else{let key=at(n,s.b);if(seen.has(key))continue;seen.add(key);q.push({p:n,b:s.b,par:s,mv:dd[2]})}}}}
return null};
const Z=t=>{let L=P(t);if(!L.p)return'';let rs=Q(L).filter(r=>r.bx.length);
if(!rs.length)return'';rs.sort((a,b)=>(a.porch%L.w)-(b.porch%L.w));
let m='',x=L.p%L.w;
for(let r of rs){let g=S(L,r.a,r.porch,r.hy,r.bx);if(g===null)return'';
let tx=r.porch%L.w;m+=tx>x?'r'.repeat(tx-x):'l'.repeat(x-tx);m+=g;x=tx}return m};
for(let id of E(I).sort()){let m=Z(F(I+'/'+id+'/level.txt','utf8'));M(O+'/'+id,{recursive:true});W(O+'/'+id+'/solution.txt',m+'\n')}
