import{mkdirSync as M,readdirSync as E,readFileSync as F,writeFileSync as W}from'node:fs';
const I=process.env.MAKEFUN_INPUT_DIR||'/input',O=process.env.MAKEFUN_OUTPUT_DIR||'/output',V=[[0,-1,'u'],[0,1,'d'],[-1,0,'l'],[1,0,'r']];
const A=(L,c,d)=>{let x=c%L.w+d[0],y=(c/L.w+d[1])|0;return x<0||y<0||x>=L.w||y>=L.h?-1:y*L.w+x};
const P=t=>{let r=t.split('\n').filter(Boolean),h=r.length,w=Math.max(...r.map(s=>s.length)),f=new Set,g=new Set,b=[],p=0;
for(let y=0;y<h;y++)for(let x=0;x<w;x++){let c=r[y][x]||'#',i=y*w+x;if(c=='#')continue;f.add(i);if('.*+'.includes(c))g.add(i);if('$*'.includes(c))b.push(i);if('@+'.includes(c))p=i}return{w,h,f,g,b:b.sort(),p}};
const Q=L=>{let hy=(L.p/L.w)|0,o=[];
for(let s of L.f){if((s/L.w|0)==hy)continue;let a=new Set([s]),q=[s],p=s;L.f.delete(s);
for(let c of q)for(let d of V){let n=A(L,c,d);if(n<0||!L.f.has(n))continue;
if((n/L.w|0)==hy){p=n;continue}L.f.delete(n);a.add(n);q.push(n)}
a.add(p);o.push({a,p})}return o};
const S=(L,a,p,st)=>{let B=[[{p:p,b:st,mv:''}]],se=new Set([p+'|'+st]);
for(let d=0;d<B.length;d++){let q=B[d];
for(let s of q){
if(s.p==p&&s.b.every(x=>L.g.has(x)))return s.mv;
for(let dd of V){let n=A(L,s.p,dd);if(n<0||!a.has(n))continue;
if(s.b.includes(n)){let t=A(L,n,dd);if(t<0||!a.has(t)||t==p||s.b.includes(t))continue;
let nb=s.b.map(x=>x==n?t:x).sort(),k=n+'|'+nb;
if(se.has(k))continue;se.add(k);(B[d+1]=B[d+1]||[]).push({p:n,b:nb,mv:s.mv+dd[2]});
}else{let k=n+'|'+s.b;if(se.has(k))continue;se.add(k);q.push({p:n,b:s.b,mv:s.mv+dd[2]})}}}}
return null};
const Z=t=>{let L=P(t);if(!L.p)return'';let m='',x=L.p%L.w;
for(let r of Q(L)){let bx=L.b.filter(b=>r.a.has(b));if(!bx.length)continue;
let g=S(L,r.a,r.p,bx);if(g===null)return'';let y=r.p%L.w;m+=y>x?'r'.repeat(y-x):'l'.repeat(x-y);m+=g;x=y}return m};
for(let id of E(I)){let m=Z(F(I+'/'+id+'/level.txt','utf8'));M(O+'/'+id,{recursive:true});W(O+'/'+id+'/solution.txt',m+'\n')}
