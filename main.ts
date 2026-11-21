import{mkdirSync as M,readdirSync as E,readFileSync as F,writeFileSync as W}from'node:fs';
const I=process.env.MAKEFUN_INPUT_DIR||'/input',O=process.env.MAKEFUN_OUTPUT_DIR||'/output',V=[[0,-1,'u'],[0,1,'d'],[-1,0,'l'],[1,0,'r']];
const A=(L,c,d)=>{let x=c%L.w+d[0],y=(c/L.w+d[1])|0;return x<0||y<0||x>=L.w||y>=L.h?-1:y*L.w+x};
const P=t=>{let r=t.split('\n').filter(Boolean),h=r.length,w=Math.max(...r.map(s=>s.length)),f=new Set,g=new Set,b=[],p=0;
for(let y=0;y<h;y++)for(let x=0;x<w;x++){let c=r[y][x]||'#',i=y*w+x;if(c=='#')continue;f.add(i);if('.*+'.includes(c))g.add(i);if('$*'.includes(c))b.push(i);if('@+'.includes(c))p=i}return{w,h,f,g,b:b.sort((a,b)=>a-b),p}};
const Q=L=>{let hy=(L.p/L.w)|0,se=new Set,o=[];
for(let s of L.f){if(se.has(s)||(s/L.w|0)==hy)continue;let a=new Set([s]),q=[s];se.add(s);
for(let i=0;i<q.length;i++)for(let d of V){let n=A(L,q[i],d);if(n<0||se.has(n)||!L.f.has(n)||(n/L.w|0)==hy)continue;se.add(n);a.add(n);q.push(n)}
let p=s;for(let c of a){let x=c%L.w,y=(c-x)/L.w;if((y<hy?y+1:y-1)==hy&&L.f.has(hy*L.w+x)){p=hy*L.w+x;break}}
a.add(p);o.push({a,p,bx:L.b.filter(b=>a.has(b))})}return o};
const S=(L,a,p,st)=>{let at=(x,b)=>x+'|'+b.join(','),B=[[{p:p,b:st,par:null,mv:''}]],se=new Set([at(p,st)]);
for(let d=0;d<B.length;d++){let q=B[d];for(let h=0;h<q.length;h++){let s=q[h];
if(s.p==p&&s.b.every(x=>L.g.has(x))){let o='',k=s;while(k.par){o=k.mv+o;k=k.par}return o}
let bs=new Set(s.b);
for(let dd of V){let n=A(L,s.p,dd);if(n<0||!a.has(n))continue;
if(bs.has(n)){let t=A(L,n,dd);if(t<0||!a.has(t)||t==p||bs.has(t))continue;
let nb=s.b.map(x=>x==n?t:x).sort((a,b)=>a-b);let key=at(n,nb);
if(se.has(key))continue;se.add(key);(B[d+1]||(B[d+1]=[])).push({p:n,b:nb,par:s,mv:dd[2]});
}else{let key=at(n,s.b);if(se.has(key))continue;se.add(key);q.push({p:n,b:s.b,par:s,mv:dd[2]})}}}}
return null};
const Z=t=>{let L=P(t);if(!L.p)return'';let rs=Q(L).filter(r=>r.bx.length);if(!rs.length)return'';
rs.sort((a,b)=>(a.p%L.w)-(b.p%L.w));let m='',x=L.p%L.w;
for(let r of rs){let g=S(L,r.a,r.p,r.bx);if(g===null)return'';let t=r.p%L.w;m+=t>x?'r'.repeat(t-x):'l'.repeat(x-t);m+=g;x=t}return m};
for(let id of E(I)){let m=Z(F(I+'/'+id+'/level.txt','utf8'));M(O+'/'+id,{recursive:true});W(O+'/'+id+'/solution.txt',m+'\n')}
