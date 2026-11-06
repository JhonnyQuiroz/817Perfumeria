import { bootstrapApplication } from '@angular/platform-browser';
import { Component, HostListener, OnInit } from '@angular/core';
import { CONFIG, SITE } from './config';
import { DEMO_CSV, Product, norm, parseCsv, sizeKey, toProducts } from './catalog';

interface CartLine { key: string; name: string; size: string; qty: number; }
interface CartRow { line: CartLine; unit: number | null; }
const STORE_KEY = 'cart-v1';

@Component({
 selector: 'app-root', standalone: true,
 template: `
 <header class="header wrap"><a class="logo" href="#">{{site.brand}}</a>
  <nav><a href="#catalogo">Catálogo</a><a class="hide-sm" href="#como-funciona">Cómo funciona</a>
   <button type="button" class="cart-btn" (click)="openCart()">Pedido@if (count>0) {<b>{{count}}</b>}</button></nav></header>
 <main>
  <section class="hero wrap">
   <div class="copy">
    <div class="eyebrow">{{site.eyebrow}}</div>
    <h1>{{site.titleStart}}<em>{{site.titleEm}}</em>{{site.titleEnd}}</h1>
    <p class="lead">{{site.heroText}}</p>
    <div class="stats">@for (s of site.stats; track $index) {<div><b>{{s.value}}</b><span>{{s.label}}</span></div>}</div>
   </div>
   <div class="visual">
    @if (heroSrc && heroOk) {<img [src]="heroSrc" [alt]="site.heroImageAlt" referrerpolicy="no-referrer" (error)="heroOk=false">}
    @else {<div class="visual-fallback" aria-hidden="true"><i></i><i></i><i></i></div>}
   </div>
  </section>

  <section id="catalogo" class="section wrap">
   <div class="eyebrow">{{site.catalogLabel}}</div><h2>{{site.catalogTitle}}</h2>
   @if (demo) {<p class="demo-note">Modo demostración. Pega la URL de tu hoja publicada en <code>src/config.ts</code> para ver tus productos.</p>}
   @if (status==='ready' && categories.length>2) {<div class="chips">@for (c of categories; track c) {<button type="button" class="chip" [class.on]="c===category" (click)="category=c">{{c}}</button>}</div>}
   @if (status==='loading') {<p class="state">Cargando catálogo…</p>}
   @if (status==='error') {<p class="state">No pudimos cargar el catálogo. Intenta de nuevo en un momento.</p>}
   @if (status==='ready') {<div class="grid">
    @for (p of filtered; track $index) {<article class="product" [class.sold]="!p.available">
     <div class="thumb">@if (p.image) {<img [src]="p.image" [alt]="p.name" loading="lazy" referrerpolicy="no-referrer" (error)="p.image=''">} @else {<span>{{p.name.charAt(0)}}</span>}
      @if (p.featured) {<b class="tag">Destacado</b>}@if (!p.available) {<b class="tag off">Agotado</b>}</div>
     <div class="pbody"><small>{{p.category}}</small><h3>{{p.name}}</h3><p>{{p.description}}</p>
      @if (sizesFor(p).length) {<div class="sizes" role="group" aria-label="Tamaño">@for (z of sizesFor(p); track z) {<button type="button" class="size" [class.on]="z===sizeOf(p)" [disabled]="!p.available" (click)="pick(p,z)">{{z}}</button>}</div>}
      <div class="prow"><strong>{{priceLabel(p)}}</strong>@if (p.available) {<button type="button" class="btn" [class.done]="added===lineKey(p)" (click)="add(p)">{{added===lineKey(p)?'Agregado ✓':'Agregar'}}</button>}</div></div>
    </article>} @empty {<p class="state">No hay productos en esta categoría.</p>}
   </div>}
  </section>

  <section id="como-funciona" class="section wrap">
   <div class="eyebrow">{{site.howLabel}}</div><h2>{{site.howTitle}}</h2>
   <div class="info">@for (i of site.info; track $index) {<article><span>{{$index+1}}</span><h3>{{i.title}}</h3><p>{{i.text}}</p></article>}</div>
  </section>
 </main>
 @if (count>0 && !cartOpen) {<button type="button" class="fab" (click)="openCart()">Ver pedido · {{count}}</button>}
 @if (cartOpen) {<div class="overlay" (click)="closeCart()"></div>
 <aside class="drawer" role="dialog" aria-modal="true" aria-label="Tu pedido">
  <div class="d-head"><h3>Tu pedido</h3><button type="button" class="x" (click)="closeCart()" aria-label="Cerrar">×</button></div>
  @if (!cartView.length) {<p class="state">Aún no has agregado productos.</p>}
  <ul class="lines">@for (v of cartView; track v.line.key) {<li>
   <div class="l-info"><b>{{v.line.name}}</b>@if (v.line.size) {<small>{{v.line.size}}</small>}<span>{{v.unit!==null?fmt(v.unit):'Consultar'}}</span></div>
   <div class="qty"><button type="button" (click)="dec(v.line)" aria-label="Quitar una unidad">−</button><span>{{v.line.qty}}</span><button type="button" (click)="inc(v.line)" aria-label="Agregar una unidad">+</button></div>
  </li>}</ul>
  @if (cartView.length) {<div class="d-foot">
   <div class="total"><span>Total</span><strong>{{fmt(total)}}</strong></div>
   @if (hasUnpriced) {<small>No incluye los productos con precio por consultar.</small>}
   @if (canOrder) {<a class="btn solid" [href]="waCart" target="_blank" rel="noopener">Enviar pedido por WhatsApp</a>}
   <button type="button" class="link-btn" (click)="clear()">Vaciar pedido</button>
  </div>}
 </aside>}
 <footer class="footer wrap"><span>© 2026 {{site.brand}}</span><span>{{site.footerNote}}</span></footer>`
})
export class AppComponent implements OnInit {
 site=SITE;
 heroSrc=/^https?:\/\//i.test(SITE.heroImage.trim())?SITE.heroImage.trim():'';
 heroOk=true;
 status: 'loading'|'ready'|'error'='loading';
 products: Product[]=[];
 category='Todos';
 demo=!CONFIG.sheetCsvUrl;
 canOrder=!!CONFIG.whatsapp;
 private wa=`https://wa.me/${CONFIG.whatsapp}`;
 private money=new Intl.NumberFormat(CONFIG.locale,{style:'currency',currency:CONFIG.currency,maximumFractionDigits:0});

 // Carrito
 cart: CartLine[]=[];
 cartView: CartRow[]=[];
 count=0; total=0; hasUnpriced=false; waCart=this.wa;
 cartOpen=false;
 added='';
 private sizeSel: Record<string,string>={};

 get categories(): string[] { return ['Todos', 'Inspirados', 'Replica 1.1', 'Original']; }
 get filtered(): Product[] { return this.category==='Todos'?this.products:this.products.filter(p=>p.category===this.category); }

 fmt(n: number): string { return this.money.format(n); }
 sizesFor(p: Product): string[] {
  const hit=Object.entries(CONFIG.sizes).find(([cat])=>norm(cat)===norm(p.category));
  return hit?hit[1]:[];
 }
 sizeOf(p: Product): string { return this.sizeSel[p.name]??this.sizesFor(p)[0]??''; }
 pick(p: Product,size: string): void { this.sizeSel[p.name]=size; }
 unitPrice(p: Product,size: string): number|null {
  const bySize=size?p.sizePrices[sizeKey(size)]:undefined;
  return bySize!==undefined?bySize:p.price;
 }
 priceLabel(p: Product): string {
  const n=this.unitPrice(p,this.sizeOf(p));
  return n!==null?this.money.format(n):(p.priceText||'Consultar');
 }
 lineKey(p: Product): string { return p.name+'|'+this.sizeOf(p); }

 // Acciones del carrito
 add(p: Product): void {
  const size=this.sizeOf(p), key=p.name+'|'+size;
  const line=this.cart.find(l=>l.key===key);
  if (line) { line.qty++; } else { this.cart.push({key,name:p.name,size,qty:1}); }
  this.added=key; setTimeout(()=>{ if (this.added===key) this.added=''; },1200);
  this.sync();
 }
 inc(l: CartLine): void { l.qty++; this.sync(); }
 dec(l: CartLine): void {
  l.qty--;
  if (l.qty<=0) this.cart=this.cart.filter(x=>x!==l);
  this.sync();
 }
 clear(): void { this.cart=[]; this.sync(); }
 openCart(): void { this.cartOpen=true; document.body.style.overflow='hidden'; }
 closeCart(): void { this.cartOpen=false; document.body.style.overflow=''; }
 @HostListener('document:keydown.escape') onEsc(): void { if (this.cartOpen) this.closeCart(); }

 /** Recalcula totales y el mensaje de WhatsApp, y guarda el carrito. */
 private sync(): void {
  this.cartView=this.cart.map(line=>{
   const p=this.products.find(x=>x.name===line.name);
   return {line,unit:p?this.unitPrice(p,line.size):null};
  });
  this.count=this.cart.reduce((n,l)=>n+l.qty,0);
  this.total=this.cartView.reduce((t,r)=>t+(r.unit!==null?r.unit*r.line.qty:0),0);
  this.hasUnpriced=this.cartView.some(r=>r.unit===null);
  const items=this.cart.map(l=>l.name+(l.size?` (${l.size})`:'')+(l.qty>1?`: ${l.qty}`:'')).join(' - ');
  this.waCart=`${this.wa}?text=${encodeURIComponent(CONFIG.orderMessage+items)}`;
  if (!this.cart.length && this.cartOpen) this.closeCart();
  try { localStorage.setItem(STORE_KEY,JSON.stringify(this.cart.map(({name,size,qty})=>({name,size,qty})))); } catch { /* sin almacenamiento */ }
 }
 private restore(): void {
  try {
   const raw: unknown=JSON.parse(localStorage.getItem(STORE_KEY)??'[]');
   if (!Array.isArray(raw)) return;
   this.cart=raw.flatMap((x: {name?: unknown; size?: unknown; qty?: unknown}): CartLine[] => {
    const name=typeof x.name==='string'?x.name:'', size=typeof x.size==='string'?x.size:'', qty=Number(x.qty);
    const p=this.products.find(q=>q.name===name&&q.available);
    return p&&Number.isInteger(qty)&&qty>0?[{key:name+'|'+size,name,size,qty:Math.min(qty,99)}]:[];
   });
  } catch { this.cart=[]; }
 }

 async ngOnInit(): Promise<void> {
  try {
   let csv=DEMO_CSV;
   if (CONFIG.sheetCsvUrl) {
    const res=await fetch(CONFIG.sheetCsvUrl,{cache:'no-store'});
    if (!res.ok) throw new Error('HTTP '+res.status);
    csv=await res.text();
   }
   this.products=toProducts(parseCsv(csv));
   this.restore(); this.sync();
   this.status='ready';
  } catch (error: unknown) {
   console.error('Error cargando el catálogo',error);
   this.status='error';
  }
 }
}
bootstrapApplication(AppComponent).catch((error: unknown)=>console.error(error));
