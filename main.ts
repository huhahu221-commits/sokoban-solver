import{readdirSync as R,readFileSync as F,mkdirSync as K,writeFileSync as W}from'node:fs';
const I=process.env.MAKEFUN_INPUT_DIR||'/input',O=process.env.MAKEFUN_OUTPUT_DIR||'/output';
for(const d of R(I)){
const s=F(I+'/'+d+'/level.txt','utf8').trimEnd().split('\n'),w=s[0].length,J=s.join(''),n=J.length,D=[-w,w,-1,1];
const a=Array(n).fill(1),G=Array(n).fill(0),B=[];let p=0;
for(let i=0;i<n;i++){const c=J[i];if(c!='#'){a[i]=0;if('.*+'.includes(c))G[i]=1;if('$*'.includes(c))B.push(i);if('@+'.includes(c))p=i}}
const Y=p/w|0,BX=Array(n).fill(0);for(const x of B)BX[x]=1;
const oc=BX.slice();
let Z='',P=p;
const wk=(f,t)=>{
if(f==t)return'';
const U=Array(n).fill(-1),Q=[f];U[f]=f;
for(const c of Q){if(c==t)break;for(const e of D){const u=c+e;if(a[u]&1||oc[u]||U[u]>=0)continue;U[u]=c,Q.push(u)}}
if(U[t]<0)return;
let z='';for(let c=t;c!=f;c=U[c])z='udlr'[D.indexOf(c-U[c])]+z;
return z};
for(const b of B){
if(a[b])continue;
const q=[b],bs=[];a[b]=2;
for(const c of q){if(BX[c])bs.push(c);
for(const e of D){const u=c+e;if(!a[u]&&(u/w|0)!=Y){a[u]=2;q.push(u)}}}
bs.sort();
let o=-1;
for(const c of q)for(const e of D){const u=c+e;if((u/w|0)==Y)o=u}
if(o<0)continue;
const m=Array(n).fill(1);for(const c of q)m[c]=0;m[o]=0;
const L=Array(n).fill(0),lq=[];
for(let g=0;g<n;g++)if(G[g]&&!m[g]){L[g]=1;lq.push(g)}
for(const c of lq)for(const e of D){const u=c-e;if(!m[u]&&!m[u-e]&&!L[u]){L[u]=1;lq.push(u)}}
const z0=wk(P,o);if(z0==null)continue;
Z+=z0;P=o;
const S=[bs],W2=[o],PA=[-1],PT=[0],HM={},sn=Array(n).fill(0),mk=Array(n).fill(0);
let sp=0,fd=-1;
const rc=(f,r,b)=>{const q=++sp;let l=f,U=[f];r[f]=q;for(const c of U){if(c<l)l=c;for(const e of D){const u=c+e;if(!m[u]&&!b.includes(u)&&r[u]!=q){r[u]=q;U.push(u)}}}return l};
HM[rc(o,sn,bs)+','+bs]=0;
for(let hd=0;fd<0&&hd<S.length;hd++){
const bb=S[hd];
const sg=(rc(W2[hd],sn,bb),sp);
for(const bx of bb){
for(const e of D){const t=bx+e;
if(t==o|sn[bx-e]!=sg|m[t]|bb.includes(t)|!L[t])continue;
const nb=bb.map(x=>x==bx?t:x).sort();const ky=rc(bx,mk,nb)+','+nb;
if(ky in HM)continue;
HM[ky]=S.length;S.push(nb);W2.push(bx);PA.push(hd);PT.push(t);
if(nb.every(x=>G[x]))fd=S.length-1}}
}
if(fd<0)continue;
const PZ=[];
for(let s=fd;s>0;s=PA[s])PZ.unshift([W2[s],PT[s]]);
for(const[f2,t]of PZ){
const z1=wk(P,2*f2-t);if(z1==null)break;
Z+=z1+'udlr'[D.indexOf(t-f2)];
oc[P=f2]=0;oc[t]=1}
}
K(O+'/'+d,{recursive:true});
W(O+'/'+d+'/solution.txt',Z+'\n');
}
