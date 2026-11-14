import { bootstrapApplication } from '@angular/platform-browser';
import { Component, HostListener, OnInit } from '@angular/core';
import { CONFIG, SITE } from './config';
import { DEMO_CSV, Product, norm, parseCsv, sizeKey, toProducts } from './catalog';
import { decodeOrder, encodeOrder } from './order-code';

interface CartLine { key: string; name: string; size: string; qty: number; }
interface CartRow { line: CartLine; unit: number | null; regular: number | null; image: string; }
interface Decoded { code: string; when: string; total: string; unpriced: boolean; items: { name: string; size: string; qty: number }[]; row: string; }
const STORE_KEY = 'cart-v1';

function editDistance(a: string,b: string): number {
 let previous=Array.from({length:b.length+1},(_,i)=>i);
 for (let i=1;i<=a.length;i++) {
  const current=[i];
  for (let j=1;j<=b.length;j++) current[j]=Math.min(current[j-1]+1,previous[j]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));
  previous=current;
 }
 return previous[b.length];
}

@Component({
 selector: 'app-root', standalone: true,
 template: `
 <header id="page-top" class="header">
  <a class="logo" [class.with-image]="!!site.logoImage" href="#page-top" (click)="scrollToTop($event)">
   @if (site.logoImage) {<img [src]="site.logoImage" [alt]="site.logoImageAlt" (error)="site.logoImage=''">}
   <span>{{site.brand}}</span>
  </a>
  <div class="header-search-wrap" (click)="$event.stopPropagation()">
   <div class="header-search">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>
    <input type="search" aria-label="Buscar perfumes" placeholder="Buscar perfumes..." [value]="searchQuery" (input)="setSearch($event)" (focus)="searchActive=true" (keydown.escape)="closeSearch()">
    @if (searchQuery) {<button type="button" class="search-clear" aria-label="Limpiar búsqueda" (click)="clearSearch()">×</button>}
   </div>
   @if (searchActive && searchQuery.trim()) {<div class="search-results">
    @for (p of searchResults; track $index) {<button type="button" class="search-result" (click)="selectSearchResult(p)">
     <span class="search-image">@if (p.image) {<img [src]="p.image" [alt]="p.name" (error)="p.image=''">} @else {<span>{{p.name.charAt(0)}}</span>}</span>
     <b>{{p.name}}</b><strong>{{searchPrice(p)}}</strong>
    </button>} @empty {<p class="search-empty">No encontramos perfumes con ese nombre.</p>}
   </div>}
  </div>
  <nav><a class="hide-sm" href="#como-funciona">Cómo funciona</a><a class="hide-sm" href="#catalogo">Catálogo</a>
   <button type="button" class="cart-btn" (click)="openCart()">Pedido@if (count>0) {<b>{{count}}</b>}</button></nav></header>
 <main>
  @if (showDecoder) {<section id="decodificar" class="section wrap decoder">
   <div class="eyebrow">Herramienta interna</div><h2>Consultar pedido</h2>
   <div class="dec-row"><input #codeIn class="dec-input" type="text" placeholder="PED-XXXXX-XXXXX-…" autocomplete="off" (keyup.enter)="decode(codeIn.value)"><button type="button" class="btn solid" (click)="decode(codeIn.value)">Consultar</button></div>
   @if (decErr) {<p class="state">{{decErr}}</p>}
   @if (decRes) {<div class="dec-card">
    <dl><div><dt>Fecha</dt><dd>{{decRes.when}}</dd></div><div><dt>Total</dt><dd class="price">{{decRes.total}}</dd></div></dl>
    @if (decRes.unpriced) {<p class="note">Incluye productos con precio por consultar: el total no los suma.</p>}
    <ul>@for (i of decRes.items; track $index) {<li><span>{{i.name}}@if (i.size) { · {{i.size}}}</span><b>× {{i.qty}}</b></li>}</ul>
    <button type="button" class="btn" (click)="copyRow(decRes.row)">{{copied?'Copiado ✓':'Copiar fila para Excel'}}</button>
   </div>}
  </section>}
  

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

  <section id="como-funciona" class="section wrap how">
   <div class="eyebrow">{{site.howLabel}}</div><h2>{{site.howTitle}}</h2>
   <div class="info">@for (i of site.info; track $index) {<article><span>{{$index+1}}</span><h3>{{i.title}}</h3><p>{{i.text}}</p></article>}</div>
  </section>

  <section id="catalogo" class="section wrap">
   <div class="eyebrow">{{site.catalogLabel}}</div><h2>{{site.catalogTitle}}</h2>
   @if (demo) {<p class="demo-note">Modo demostración. Pega la URL de tu hoja publicada en <code>src/config.ts</code> para ver tus productos.</p>}
   @if (status==='ready') {<div id="catalog-filters" class="filters">
    @if (categories.length>2) {<div class="chips">@for (c of categories; track c) {<button type="button" class="chip" [class.on]="c===category" (click)="setCategory(c)">{{c}}</button>}</div>}
    <div class="chips row2">
     @if (showDama) {<button type="button" class="chip" [class.on]="gender==='dama'" [attr.aria-pressed]="gender==='dama'" (click)="toggleGender('dama')">Dama</button>}
     @if (showCaballero) {<button type="button" class="chip" [class.on]="gender==='caballero'" [attr.aria-pressed]="gender==='caballero'" (click)="toggleGender('caballero')">Caballero</button>}
     @if (showDiscount) {<button type="button" class="chip" [class.on]="onlyDisc" [attr.aria-pressed]="onlyDisc" (click)="toggleDisc()">Descuento</button>}
     <label class="sort-wrap"><span>Ordenar</span><select #sortSel (change)="setSort(sortSel.value)">
      <option value="none" [selected]="sort==='none'">Relevancia</option>
      <option value="asc" [selected]="sort==='asc'">Precio: menor a mayor</option>
      <option value="desc" [selected]="sort==='desc'">Precio: mayor a menor</option></select></label>
    </div>
   </div>}
   @if (status==='loading') {<p class="state">Cargando catálogo…</p>}
   @if (status==='error') {<p class="state">No pudimos cargar el catálogo. Intenta de nuevo en un momento.</p>}
   @if (status==='ready') {<div class="grid">
    @for (p of shown; track $index) {<article class="product" [class.sold]="!p.available" [attr.aria-label]="'Ver detalles de '+p.name" tabindex="0" (click)="openProduct(p)" (keydown.enter)="openProductFromKey(p,$event)" (keydown.space)="openProductFromKey(p,$event)">
     <div class="thumb">@if (p.image) {<img [src]="p.image" [alt]="p.name" loading="lazy" referrerpolicy="no-referrer" (error)="p.image=''">} @else {<span>{{p.name.charAt(0)}}</span>}
      @if (p.discount>0 && p.available) {<b class="tag disc">Descuento {{pct(p.discount)}}</b>}@if (!p.available) {<b class="tag off">Agotado</b>}</div>
     <div class="pbody"><small>{{p.category}}</small><h3>{{p.name}}</h3>
      @if (sizesFor(p).length && !isInspired(p)) {<div class="product-sizes"><b>Tamaños</b><span>{{sizesFor(p).join(', ')}}</span></div>}
      <p>{{p.description}}</p>
      @if (sizesFor(p).length && isInspired(p)) {<div class="sizes" role="group" aria-label="Tamaño">@for (z of sizesFor(p); track z) {<button type="button" class="size" [class.on]="z===sizeOf(p)" [attr.aria-pressed]="z===sizeOf(p)" [disabled]="!p.available" (click)="$event.stopPropagation(); pick(p,z)">{{z}}</button>}</div>}
      <div class="prow"><span class="pr">@if (hasCardDiscount(p)) {<s>{{cardRegularLabel(p)}}</s>}<strong>{{cardPriceLabel(p)}}</strong></span>@if (p.available) {<button type="button" class="btn" [class.done]="added===lineKey(p)" (click)="$event.stopPropagation(); addFromCard(p)">{{added===lineKey(p)?'Agregado ✓':'Agregar'}}</button>}</div></div>
    </article>} @empty {<p class="state">No hay productos con estos filtros. <button type="button" class="link-btn" (click)="clearFilters()">Limpiar filtros</button></p>}
   </div>}
  </section>
 </main>
 @if (count>0 && !cartOpen) {<button type="button" class="fab" (click)="openCart()">Ver pedido · {{count}}</button>}
 @if (canOrder) {<a class="whatsapp-fab" [class.with-cart]="count>0 && !cartOpen" [href]="whatsappLink" target="_blank" rel="noopener noreferrer" aria-label="Abrir WhatsApp">
  <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M16 3.2a12.8 12.8 0 0 0-11 19.3L3.3 28.7l6.4-1.7A12.8 12.8 0 1 0 16 3.2Z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.2 9.5c-.5 0-1 .2-1.4.7-.5.5-1.3 1.3-1.3 3.1s1.3 3.6 1.5 3.8c.2.3 2.5 4 6.2 5.4 3.1 1.2 3.7 1 4.4.9.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.7.2-1.8-.1-.2-.5-.3-1-.6-.5-.2-2.2-1.1-2.6-1.2-.3-.1-.6-.2-.8.2-.2.5-.9 1.2-1.1 1.5-.2.3-.4.3-.8.1-.5-.2-1.7-.6-3.2-2-1.2-1-2-2.3-2.2-2.7-.2-.4 0-.6.2-.8.2-.2.5-.6.7-.8.2-.3.2-.5.4-.8.1-.3 0-.6 0-.8-.1-.2-.8-1.9-1.1-2.6-.3-.7-.6-.6-.8-.6h-.7Z" fill="currentColor"/></svg>
 </a>}
 @if (showBackToFilters && status==='ready') {<button type="button" class="back-to-filters" [class.with-cart]="count>0 && !cartOpen" (click)="scrollToFilters()" aria-label="Volver a los filtros" title="Volver a los filtros">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 11 7-7 7 7M12 4v16"/></svg>
 </button>}
 @if (detailProduct; as p) {<div class="product-overlay" (click)="closeProduct()"></div>
 <section class="product-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title">
  <button type="button" class="x detail-close" (click)="closeProduct()" aria-label="Cerrar">×</button>
  <div class="detail-layout">
   <div class="detail-thumb">@if (p.image && detailImageOk) {<img [src]="p.image" [alt]="p.name" referrerpolicy="no-referrer" (error)="detailImageOk=false">} @else {<span>{{p.name.charAt(0)}}</span>}
    @if (p.discount>0 && p.available) {<b class="tag disc">Descuento {{pct(p.discount)}}</b>}@if (!p.available) {<b class="tag off">Agotado</b>}
   </div>
   <div class="detail-body">
    <small>{{p.category}}</small><h2 id="detail-title">{{p.name}}</h2>
    @if (p.description) {<p class="detail-description">{{p.description}}</p>}
    <p class="detail-meta">@if (p.gender) {<span>{{genderLabel(p.gender)}}</span>}<span>{{p.available?'Disponible':'Agotado'}}</span></p>
    @if (sizesFor(p).length) {<div class="detail-sizes"><b>Tamaño</b><div class="sizes" role="group" aria-label="Tamaño">@for (z of sizesFor(p); track z) {<button type="button" class="size" [class.on]="z===detailSize" [attr.aria-pressed]="z===detailSize" (click)="pickDetailSize(z)">{{z}}</button>}</div>
     @if (!detailSize) {<p class="detail-size-error" role="status">Selecciona un tamaño antes de agregar el perfume al pedido.</p>}
    </div>}
    <div class="detail-price"><span class="pr">@if (detailHasDiscount(p)) {<s>{{detailRegularLabel(p)}}</s>}<strong>{{detailPriceLabel(p)}}</strong></span></div>
    <button type="button" class="btn solid detail-add" [disabled]="!p.available || (sizesFor(p).length>0 && !detailSize)" (click)="addFromDetail()">{{!p.available?'Agotado':(sizesFor(p).length>0 && !detailSize?'Selecciona un tamaño':'Agregar al pedido')}}</button>
   </div>
  </div>
 </section>}
 @if (cartOpen) {<div class="overlay" (click)="closeCart()"></div>
 <aside class="drawer" role="dialog" aria-modal="true" aria-label="Tu pedido">
  <div class="d-head"><h3>Tu pedido</h3><button type="button" class="x" (click)="closeCart()" aria-label="Cerrar">×</button></div>
  @if (!cartView.length) {<p class="state">Aún no has agregado productos.</p>}
  <ul class="lines">@for (v of cartView; track v.line.key) {<li>
   <div class="cart-thumb">@if (v.image) {<img [src]="v.image" [alt]="v.line.name" loading="lazy" referrerpolicy="no-referrer" (error)="v.image=''">} @else {<span>{{v.line.name.charAt(0)}}</span>}</div>
   <div class="l-info"><b>{{v.line.name}}</b>@if (v.line.size) {<small>{{v.line.size}}</small>}<span>@if (v.regular!==null && v.unit!==null && v.regular!==v.unit) {<s>{{fmt(v.regular)}}</s>}{{v.unit!==null?fmt(v.unit):'Consultar'}}</span></div>
   <div class="qty"><button type="button" (click)="dec(v.line)" aria-label="Quitar una unidad">−</button><span>{{v.line.qty}}</span><button type="button" (click)="inc(v.line)" aria-label="Agregar una unidad">+</button></div>
  </li>}</ul>
  @if (cartView.length) {<div class="d-foot">
   <div class="total"><span>Total</span><strong>{{fmt(total)}}</strong></div>
   @if (hasUnpriced) {<small>No incluye los productos con precio por consultar.</small>}
   @if (canOrder) {<button type="button" class="btn solid" (click)="sendOrder()">Enviar pedido por WhatsApp</button>}
   <button type="button" class="link-btn" (click)="clear()">Vaciar pedido</button>
  </div>}
 </aside>}
 <footer class="site-footer">
  <div class="footer-main wrap">
   <section class="footer-cta">
    <div><span class="footer-kicker">{{site.brand}} · {{site.eyebrow}}</span><h2>Tu próxima fragancia te espera.</h2><p>Explora el catálogo y encuentra tu próximo aroma.</p></div>
    <a class="footer-cta-button" href="#catalogo">Ver catálogo <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></a>
   </section>
   <div class="footer-grid" [class.with-social]="!!(site.socials.instagram || site.socials.facebook || site.socials.tiktok)">
    <section class="footer-brand">
     <a class="footer-logo" href="#page-top" (click)="scrollToTop($event)">
      @if (site.logoImage) {<img [src]="site.logoImage" [alt]="site.logoImageAlt" (error)="site.logoImage=''">}
      <span>{{site.brand}}</span>
     </a>
     <p>{{site.heroText}}</p>
    </section>
    <nav class="footer-column" aria-label="Enlaces del sitio">
     <h3>Explora</h3><a href="#catalogo">Catálogo</a><a href="#como-funciona">Cómo funciona</a><a href="#page-top" (click)="scrollToTop($event)">Volver al inicio</a>
    </nav>
    <section class="footer-column">
     <h3>Atención</h3>
     @if (canOrder) {<a class="footer-contact-link" [href]="whatsappLink" target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.2a12.8 12.8 0 0 0-11 19.3L3.3 28.7l6.4-1.7A12.8 12.8 0 1 0 16 3.2Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.2 9.5c-.5 0-1 .2-1.4.7-.5.5-1.3 1.3-1.3 3.1s1.3 3.6 1.5 3.8c.2.3 2.5 4 6.2 5.4 3.1 1.2 3.7 1 4.4.9.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.7.2-1.8-.1-.2-.5-.3-1-.6-.5-.2-2.2-1.1-2.6-1.2-.3-.1-.6-.2-.8.2-.2.5-.9 1.2-1.1 1.5-.2.3-.4.3-.8.1-.5-.2-1.7-.6-3.2-2-1.2-1-2-2.3-2.2-2.7-.2-.4 0-.6.2-.8.2-.2.5-.6.7-.8.2-.3.2-.5.4-.8.1-.3 0-.6 0-.8-.1-.2-.8-1.9-1.1-2.6-.3-.7-.6-.6-.8-.6h-.7Z" fill="currentColor"/></svg>
      Escríbenos por WhatsApp
     </a>}
     <span class="footer-country">Atención en Colombia</span>
    </section>
    @if (site.socials.instagram || site.socials.facebook || site.socials.tiktok) {<section class="footer-column footer-social">
     <h3>Síguenos</h3><div class="social-links">
      @if (site.socials.instagram) {<a [href]="site.socials.instagram" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle class="social-dot" cx="17.5" cy="6.5" r="1"/></svg></a>}
      @if (site.socials.facebook) {<a [href]="site.socials.facebook" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.4 1.5-1.4h1.7v-2.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H7.2v3h2.8v8z"/></svg></a>}
      @if (site.socials.tiktok) {<a [href]="site.socials.tiktok" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v11.2a3.3 3.3 0 1 1-2.6-3.2V8.3a7 7 0 1 0 5.7 6.8V8.8c1.2.9 2.7 1.4 4.3 1.4V7.1c-2.8-.1-4.8-1.8-5.2-4.1z"/></svg></a>}
     </div>
    </section>}
   </div>
   <div class="footer-bottom"><span>© {{currentYear}} {{site.brand}}</span><span>{{site.footerNote}}</span></div>
  </div>
 </footer>`
})
export class AppComponent implements OnInit {
 site=SITE;
 currentYear=new Date().getFullYear();
 heroSrc=/^https?:\/\//i.test(SITE.heroImage.trim())?SITE.heroImage.trim():'';
 heroOk=true;
 status: 'loading'|'ready'|'error'='loading';
 products: Product[]=[];
 category='Todos';
 gender: ''|'dama'|'caballero'='';
 onlyDisc=false;
 sort: 'none'|'asc'|'desc'='none';
 shown: Product[]=[];
 showDama=false; showCaballero=false; showDiscount=false;
 demo=!CONFIG.sheetCsvUrl;
 canOrder=!!CONFIG.whatsapp;
 private wa=`https://wa.me/${CONFIG.whatsapp}`;
 whatsappLink=this.wa;
 private money=new Intl.NumberFormat(CONFIG.locale,{style:'currency',currency:CONFIG.currency,maximumFractionDigits:0});
 searchQuery='';
 searchActive=false;
 showBackToFilters=false;

 // Carrito
 cart: CartLine[]=[];
 cartView: CartRow[]=[];
 count=0; total=0; hasUnpriced=false;
 cartOpen=false;
 added='';
 private sizeSel: Record<string,string>={};
 detailProduct: Product|null=null;
 detailSize='';
 detailImageOk=true;

 // Herramienta interna: abre  tu-sitio/#decodificar
 showDecoder=location.hash==='#decodificar';
 decErr=''; decRes: Decoded|null=null; copied=false;
 @HostListener('window:hashchange') onHash(): void { this.showDecoder=location.hash==='#decodificar'; }
 @HostListener('window:scroll') onScroll(): void { this.showBackToFilters=window.scrollY>420; }
 @HostListener('document:click',['$event']) onDocumentClick(event: Event): void {
  const target=event.target;
  if (!(target instanceof Element)||!target.closest('.header-search-wrap')) this.searchActive=false;
 }

 get categories(): string[] { return ['Todos', 'Inspirados', 'Replica 1.1', 'Original']; }

 fmt(n: number): string { return this.money.format(n); }
 pct(n: number): string { return new Intl.NumberFormat(CONFIG.locale,{maximumFractionDigits:1}).format(n)+'%'; }

 // Filtros y orden
 setCategory(c: string): void { this.category=c; this.refresh(); }
 toggleGender(g: 'dama'|'caballero'): void { this.gender=this.gender===g?'':g; this.refresh(); }
 toggleDisc(): void { this.onlyDisc=!this.onlyDisc; this.refresh(); }
 setSort(v: string): void { this.sort=v==='asc'||v==='desc'?v:'none'; this.refresh(); }
 clearFilters(): void { this.category='Todos'; this.gender=''; this.onlyDisc=false; this.refresh(); }
 setSearch(event: Event): void {
  if (!(event.target instanceof HTMLInputElement)) return;
  this.searchQuery=event.target.value;
  this.searchActive=true;
  this.refresh();
 }
 clearSearch(): void { this.searchQuery=''; this.searchActive=false; this.refresh(); }
 closeSearch(): void { this.searchActive=false; }
 get searchResults(): Product[] {
  const query=norm(this.searchQuery);
  if (!query) return [];
  return this.shown.filter(p=>this.matchesSearch(p.name,query))
   .sort((a,b)=>this.searchRank(a,query)-this.searchRank(b,query)||a.name.localeCompare(b.name,CONFIG.locale))
   .slice(0,8);
 }
 private matchesSearch(name: string,query: string): boolean {
  const words=norm(name).split(/\s+/);
  return query.split(/\s+/).every(term=>words.some(word=>{
   if (word.includes(term)) return true;
   if (term.length<4||word.length<4) return false;
   const limit=term.length>=8?2:1;
   return Math.abs(term.length-word.length)<=limit&&editDistance(term,word)<=limit;
  }));
 }
 private searchRank(p: Product,query: string): number {
  const name=norm(p.name);
  return name===query?0:name.startsWith(query)?1:name.includes(query)?2:3;
 }
 selectSearchResult(p: Product): void { this.openProduct(p); }
 scrollToTop(event: Event): void {
  event.preventDefault(); this.searchActive=false;
  window.scrollTo({top:0,behavior:this.scrollBehavior()});
 }
 scrollToFilters(): void {
  this.searchActive=false;
  document.getElementById('catalog-filters')?.scrollIntoView({behavior:this.scrollBehavior(),block:'start'});
 }
 private scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
 }
 /** Aplica categoría, género, descuento y orden. Los de género "Unisex" salen en Dama y en Caballero. */
 private refresh(): void {
  let list=this.products.filter(p=>
   (this.category==='Todos'||p.category===this.category)
   &&(!this.gender||p.gender===this.gender||p.gender==='unisex')
   &&(!this.onlyDisc||p.discount>0)
   &&(!norm(this.searchQuery)||this.matchesSearch(p.name,norm(this.searchQuery))));
  if (this.sort!=='none') {
   const dir=this.sort==='asc'?1:-1;
   list=[...list].sort((a,b)=>{
    const pa=this.sortPrice(a), pb=this.sortPrice(b);
    if (pa===null||pb===null) return pa===pb?0:pa===null?1:-1;   // sin precio: siempre al final
    return (pa-pb)*dir;
   });
  }
  this.shown=list;
 }
 /** Precio para ordenar: el más bajo del producto con su descuento (no cambia al elegir tamaño). */
 private sortPrice(p: Product): number|null {
  const sizes=this.sizesFor(p);
  const prices=(sizes.length?sizes:['']).map(z=>this.unitPrice(p,z)).filter((n): n is number=>n!==null);
  return prices.length?Math.min(...prices):null;
 }
 sizesFor(p: Product): string[] {
  if (p.sizeOptions.length) return p.sizeOptions;
  const hit=Object.entries(CONFIG.sizes).find(([cat])=>norm(cat)===norm(p.category));
  return hit?hit[1]:Object.keys(p.sizePrices).sort((a,b)=>parseInt(a,10)-parseInt(b,10)).map(s=>s.replace(/(\d+)ml/i,'$1 ml'));
 }
 isInspired(p: Product): boolean { return norm(p.category)==='inspirados'; }
 sizeOf(p: Product): string { return this.sizeSel[p.name]??(this.isInspired(p)?this.sizesFor(p)[0]??'':''); }
 pick(p: Product,size: string): void { this.sizeSel[p.name]=size; }
 pickDetailSize(size: string): void {
  this.detailSize=size;
  if (this.detailProduct) this.sizeSel[this.detailProduct.name]=size;
 }
 openProduct(p: Product): void {
  this.detailProduct=p;
  const sizes=this.sizesFor(p),savedSize=this.sizeSel[p.name];
  if (this.isInspired(p)) this.detailSize=this.sizeOf(p);
  else if (savedSize&&sizes.includes(savedSize)) this.detailSize=savedSize;
  else this.detailSize=sizes.length===1?sizes[0]:'';
  if (this.detailSize) this.sizeSel[p.name]=this.detailSize;
  this.detailImageOk=true; this.searchActive=false;
  document.body.style.overflow='hidden';
 }
 openProductFromKey(p: Product,event: Event): void {
  if (event.target!==event.currentTarget) return;
  event.preventDefault();
  this.openProduct(p);
 }
 closeProduct(): void {
  this.detailProduct=null;
  document.body.style.overflow=this.cartOpen?'hidden':'';
 }
 requiresSizeChoice(p: Product): boolean {
  return !this.isInspired(p)&&this.sizesFor(p).length>0;
 }
 addFromCard(p: Product): void {
  if (this.requiresSizeChoice(p)) { this.openProduct(p); return; }
  this.add(p);
 }
 addFromDetail(): void {
  if (!this.detailProduct) return;
  if (!this.detailProduct.available||(this.sizesFor(this.detailProduct).length>0&&!this.detailSize)) return;
  this.add(this.detailProduct,this.detailSize);
  this.closeProduct();
 }
 genderLabel(gender: Product['gender']): string {
  return gender==='dama'?'Dama':gender==='caballero'?'Caballero':gender==='unisex'?'Unisex':'';
 }
 /** Precio regular (sin descuento) para un tamaño. */
 regularPrice(p: Product,size: string): number|null {
  const bySize=size?p.sizePrices[sizeKey(size)]:undefined;
  return bySize!==undefined?bySize:p.price;
 }
 /** Precio que paga el cliente: el regular menos el descuento, si lo tiene. */
 unitPrice(p: Product,size: string): number|null {
  const r=this.regularPrice(p,size);
  return r!==null&&p.discount>0?Math.round(r*(1-p.discount/100)):r;
 }
 hasDisc(p: Product,size=this.sizeOf(p)): boolean { return p.discount>0&&this.regularPrice(p,size)!==null; }
 regularLabel(p: Product,size=this.sizeOf(p)): string {
  const r=this.regularPrice(p,size);
  return r!==null?this.money.format(r):'';
 }
 priceLabel(p: Product,size=this.sizeOf(p)): string {
  const n=this.unitPrice(p,size);
  return n!==null?this.money.format(n):(p.priceText||'Consultar');
 }
 private lowestVariantPrice(p: Product,regular=false): number|null {
  const sizes=this.sizesFor(p);
  const prices=(sizes.length?sizes:['']).map(size=>regular?this.regularPrice(p,size):this.unitPrice(p,size)).filter((n): n is number=>n!==null);
  return prices.length?Math.min(...prices):null;
 }
 private lowestPriceSize(p: Product): string {
  const sizes=this.sizesFor(p);
  if (!sizes.length) return '';
  return sizes.reduce((best,size)=>{
   const price=this.unitPrice(p,size),bestPrice=this.unitPrice(p,best);
   return price!==null&&(bestPrice===null||price<bestPrice)?size:best;
  },sizes[0]);
 }
 searchPrice(p: Product): string {
  const price=this.lowestVariantPrice(p);
  return price!==null?this.money.format(price):(p.priceText||'Consultar');
 }
 hasCardDiscount(p: Product): boolean {
  return p.discount>0&&this.cardRegularPrice(p)!==null;
 }
 private cardRegularPrice(p: Product): number|null {
  return this.sizesFor(p).length&&!this.isInspired(p)?this.lowestVariantPrice(p,true):this.regularPrice(p,this.sizeOf(p));
 }
 cardRegularLabel(p: Product): string {
  const price=this.cardRegularPrice(p);
  return price!==null?this.money.format(price):'';
 }
 cardPriceLabel(p: Product): string {
  const sizes=this.sizesFor(p);
  if (!sizes.length||this.isInspired(p)) return this.priceLabel(p);
  const price=this.lowestVariantPrice(p);
  return price!==null?`${sizes.length>1?'Desde ':''}${this.money.format(price)}`:(p.priceText||'Consultar');
 }
 detailHasDiscount(p: Product): boolean {
  const size=this.detailSize||this.lowestPriceSize(p);
  return p.discount>0&&this.regularPrice(p,size)!==null;
 }
 detailRegularLabel(p: Product): string {
  const size=this.detailSize||this.lowestPriceSize(p);
  const price=this.regularPrice(p,size);
  return price!==null?this.money.format(price):'';
 }
 detailPriceLabel(p: Product): string {
  if (this.detailSize) return this.priceLabel(p,this.detailSize);
  const sizes=this.sizesFor(p),price=this.lowestVariantPrice(p);
  if (price===null) return p.priceText||'Consultar';
  return `${sizes.length>1?'Desde ':''}${this.money.format(price)}`;
 }
 lineKey(p: Product): string { return p.name+'|'+this.sizeOf(p); }

 // Acciones del carrito
 add(p: Product,size=this.sizeOf(p)): void {
  const key=p.name+'|'+size;
  const line=this.cart.find(l=>l.key===key);
  if (line) { line.qty++; } else { this.cart.push({key,name:p.name,size,qty:1}); }
  this.added=key; setTimeout(()=>{ if (this.added===key) this.added=''; },1200);
  this.sync();
 }
 inc(l: CartLine): void { l.qty=Math.min(l.qty+1,99); this.sync(); }
 dec(l: CartLine): void {
  l.qty--;
  if (l.qty<=0) this.cart=this.cart.filter(x=>x!==l);
  this.sync();
 }
 clear(): void { this.cart=[]; this.sync(); }
 openCart(): void { this.closeProduct(); this.cartOpen=true; document.body.style.overflow='hidden'; }
 closeCart(): void { this.cartOpen=false; document.body.style.overflow=this.detailProduct?'hidden':''; }
 @HostListener('document:keydown.escape') onEsc(): void {
  if (this.cartOpen) this.closeCart();
  else if (this.detailProduct) this.closeProduct();
  else this.searchActive=false;
 }

 /** Recalcula totales y el mensaje de WhatsApp, y guarda el carrito. */
 private sync(): void {
  this.cartView=this.cart.map(line=>{
   const p=this.products.find(x=>x.name===line.name);
   return {line,unit:p?this.unitPrice(p,line.size):null,regular:p?this.regularPrice(p,line.size):null,image:p?.image??''};
  });
  this.count=this.cart.reduce((n,l)=>n+l.qty,0);
  this.total=this.cartView.reduce((t,r)=>t+(r.unit!==null?r.unit*r.line.qty:0),0);
  this.hasUnpriced=this.cartView.some(r=>r.unit===null);
  if (!this.cart.length && this.cartOpen) this.closeCart();
  try { localStorage.setItem(STORE_KEY,JSON.stringify(this.cart.map(({name,size,qty})=>({name,size,qty})))); } catch { /* sin almacenamiento */ }
 }
 /** Arma el mensaje (un producto por línea + código de pedido) y abre WhatsApp. */
 sendOrder(): void {
  if (!this.cart.length) return;
  const lines=this.cart.map(l=>'- '+l.name+(l.size?` (${l.size})`:'')+(l.qty>1?`: ${l.qty}`:''));
  const code=encodeOrder({
   total:this.total,unpriced:this.hasUnpriced,
   items:this.cart.map(l=>({id:this.products.find(p=>p.name===l.name)?.pid??0,size:parseInt(/\d+/.exec(l.size)?.[0]??'0',10),qty:l.qty})),
  },CONFIG.orderSecret,CONFIG.orderPrefix);
  const text=[CONFIG.orderMessage.trimEnd(),...lines,'',`Código de pedido: ${code}`].join('\n');
  window.open(`${this.wa}?text=${encodeURIComponent(text)}`,'_blank','noopener');
 }

 /** Herramienta interna: pega un código y muestra fecha, productos y total. */
 decode(raw: string): void {
  this.decErr=''; this.decRes=null; this.copied=false;
  if (this.status!=='ready') { this.decErr='El catálogo aún está cargando. Intenta de nuevo en un momento.'; return; }
  const d=decodeOrder(raw,CONFIG.orderSecret,CONFIG.orderPrefix);
  if (!d) { this.decErr='Código no válido: revisa que esté completo y que orderSecret sea el mismo con el que se generó.'; return; }
  const when=new Intl.DateTimeFormat(CONFIG.locale,{dateStyle:'medium',timeStyle:'short',timeZone:CONFIG.timeZone}).format(d.date);
  const items=d.items.map(i=>({
   name:this.products.find(p=>p.pid===i.id)?.name??`Producto #${i.id} (ya no está en el catálogo)`,
   size:i.size?`${i.size} ml`:'', qty:i.qty,
  }));
  const code=raw.trim().toUpperCase();
  const row=[when,code,items.map(i=>i.name+(i.size?` (${i.size})`:'')+` x${i.qty}`).join(' | '),d.total].join('\t');
  this.decRes={code,when,total:this.money.format(d.total),unpriced:d.unpriced,items,row};
 }
 async copyRow(row: string): Promise<void> {
  try { await navigator.clipboard.writeText(row); this.copied=true; setTimeout(()=>{ this.copied=false; },1500); } catch { /* sin portapapeles */ }
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
   this.showDama=this.products.some(p=>p.gender==='dama');
   this.showCaballero=this.products.some(p=>p.gender==='caballero');
   this.showDiscount=this.products.some(p=>p.discount>0);
   this.refresh();
   this.restore(); this.sync();
   this.status='ready';
  } catch (error: unknown) {
   console.error('Error cargando el catálogo',error);
   this.status='error';
  }
 }
}
bootstrapApplication(AppComponent).catch((error: unknown)=>console.error(error));
