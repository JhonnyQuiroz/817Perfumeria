import { bootstrapApplication } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { CONFIG, SITE } from './config';
import { DEMO_CSV, Product, parseCsv, toProducts } from './catalog';

@Component({
 selector: 'app-root', standalone: true,
 template: `
 <header class="header wrap"><a class="logo" href="#">{{site.brand}}</a>
  <nav><a href="#catalogo">Catálogo</a><a href="#como-funciona">Cómo funciona</a></nav></header>
 <main>
  <section class="hero wrap">
   <div class="copy">
    <div class="eyebrow">{{site.eyebrow}}</div>
    <h1>{{site.titleStart}}<em>{{site.titleEm}}</em>{{site.titleEnd}}</h1>
    <p class="lead">{{site.heroText}}</p>
    <div class="stats">@for (s of site.stats; track $index) {<div><b>{{s.value}}</b><span>{{s.label}}</span></div>}</div>
   </div>
   <div class="visual">
    @if (site.heroImage && heroOk) {<img [src]="site.heroImage" [alt]="site.heroImageAlt" (error)="heroOk=false">}
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
     <div class="thumb">@if (p.image) {<img [src]="p.image" [alt]="p.name" loading="lazy" (error)="p.image=''">} @else {<span>{{p.name.charAt(0)}}</span>}
      @if (p.featured) {<b class="tag">Destacado</b>}@if (!p.available) {<b class="tag off">Agotado</b>}</div>
     <div class="pbody"><small>{{p.category}}</small><h3>{{p.name}}</h3><p>{{p.description}}</p>
      <div class="prow"><strong>{{priceLabel(p)}}</strong>@if (p.available && canOrder) {<a class="btn" [href]="waLink(p)" target="_blank" rel="noopener">Pedir</a>}</div></div>
    </article>} @empty {<p class="state">No hay productos en esta categoría.</p>}
   </div>}
  </section>

  <section id="como-funciona" class="section wrap">
   <div class="eyebrow">{{site.howLabel}}</div><h2>{{site.howTitle}}</h2>
   <div class="info">@for (i of site.info; track $index) {<article><span>{{$index+1}}</span><h3>{{i.title}}</h3><p>{{i.text}}</p></article>}</div>
  </section>
 </main>
 <footer class="footer wrap"><span>© 2026 {{site.brand}}</span><span>{{site.footerNote}}</span></footer>`
})
export class AppComponent implements OnInit {
 site=SITE;
 heroOk=true;
 status: 'loading'|'ready'|'error'='loading';
 products: Product[]=[];
 category='Todos';
 demo=!CONFIG.sheetCsvUrl;
 canOrder=!!CONFIG.whatsapp;
 private wa=`https://wa.me/${CONFIG.whatsapp}`;
 private money=new Intl.NumberFormat(CONFIG.locale,{style:'currency',currency:CONFIG.currency,maximumFractionDigits:0});

 get categories(): string[] { return ['Todos', 'Inspirados', 'Replica 1.1', 'Original']; }
 get filtered(): Product[] { return this.category==='Todos'?this.products:this.products.filter(p=>p.category===this.category); }
 priceLabel(p: Product): string { return p.price!==null?this.money.format(p.price):(p.priceText||'Consultar'); }
 waLink(p: Product): string { return `${this.wa}?text=${encodeURIComponent(CONFIG.orderMessage+p.name)}`; }

 async ngOnInit(): Promise<void> {
  try {
   let csv=DEMO_CSV;
   if (CONFIG.sheetCsvUrl) {
    const res=await fetch(CONFIG.sheetCsvUrl,{cache:'no-store'});
    if (!res.ok) throw new Error('HTTP '+res.status);
    csv=await res.text();
   }
   this.products=toProducts(parseCsv(csv));
   this.status='ready';
  } catch (error: unknown) {
   console.error('Error cargando el catálogo',error);
   this.status='error';
  }
 }
}
bootstrapApplication(AppComponent).catch((error: unknown)=>console.error(error));
