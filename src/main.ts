import { bootstrapApplication } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { CONFIG } from './config';
import { DEMO_CSV, Product, parseCsv, toProducts } from './catalog';

@Component({
 selector: 'app-root', standalone: true,
 template: `
 <header class="header"><a class="logo" href="#">✳ nova<span>.</span></a>
 <button class="menu" (click)="menuOpen=!menuOpen" aria-label="Abrir menú">☰</button>
 <nav [class.open]="menuOpen"><a href="#catalogo" (click)="menuOpen=false">Catálogo</a><a href="#proceso" (click)="menuOpen=false">Proceso</a><a href="#contacto" (click)="menuOpen=false">Contacto</a><a class="nav-cta" href="#contacto" (click)="menuOpen=false">Pedir ↗</a></nav></header>
 <main>
 <section class="hero wrap"><div class="copy"><div class="eyebrow">✳ &nbsp; IDEAS CON INTENCIÓN. RESULTADOS REALES.</div><h1>Haz que tu próxima gran idea <em>despegue.</em></h1><p>Una experiencia digital clara, moderna y pensada para convertir visitantes en oportunidades.</p><div class="actions"><a class="btn" href="#catalogo">Ver catálogo ↗</a><a class="link" href="#proceso">Cómo pedir ↓</a></div><div class="proof"><b>JD</b><b>AM</b><b>CR</b><span>Ideas que conectan<br><strong>Diseñadas para avanzar contigo.</strong></span></div></div>
 <div class="art"><div class="glow"></div><div class="float top">✦ &nbsp; <span>CREATIVIDAD<br><strong>Sin límites</strong></span></div><div class="dashboard"><small>OVERVIEW &nbsp; <i>● EN VIVO</i></small><h3>Tu siguiente nivel</h3><svg viewBox="0 0 420 180" role="img" aria-label="Gráfica ascendente"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#a99aff" stop-opacity=".55"/><stop offset="1" stop-color="#a99aff" stop-opacity="0"/></linearGradient></defs><path d="M0 145 Q50 130 85 125 T165 112 T245 85 T330 52 T420 12 V180 H0Z" fill="url(#fill)"/><path d="M0 145 Q50 130 85 125 T165 112 T245 85 T330 52 T420 12" fill="none" stroke="#b5a8ff" stroke-width="4" stroke-linecap="round"/></svg><footer>◉ Progreso <b>En movimiento ↗</b></footer></div><div class="float bottom">↗ &nbsp; <span>PRÓXIMO PASO<br><strong>Vamos por más</strong></span></div><div class="art-note">MENOS RUIDO. MÁS IMPACTO.</div></div><div class="scroll">01 / 03　 ━━━━━　 DESLIZA PARA EXPLORAR ↓</div></section>
 <section class="strip"><span>UNA BASE SÓLIDA PARA CRECER</span><b>✳ Estrategia</b><b>◈ Diseño</b><b>⌁ Tecnología</b><b>↗ Crecimiento</b></section>
 <section id="catalogo" class="section wrap"><div class="eyebrow">01 — CATÁLOGO</div><h2>Lo que <em>ofrecemos.</em></h2><p class="intro">Precios y disponibilidad actualizados al momento.</p>
 @if (demo) {<p class="demo-note">Modo demostración. Pega la URL de tu hoja publicada en <code>src/config.ts</code> para ver tus productos.</p>}
 @if (status==='ready' && categories.length>2) {<div class="chips">@for (c of categories; track c) {<button type="button" class="chip" [class.on]="c===category" (click)="category=c">{{c}}</button>}</div>}
 @if (status==='loading') {<p class="state">Cargando catálogo…</p>}
 @if (status==='error') {<p class="state">No pudimos cargar el catálogo. Intenta de nuevo en un momento.</p>}
 @if (status==='ready') {<div class="grid">
  @for (p of filtered; track $index) {<article class="product" [class.sold]="!p.available">
   <div class="thumb">@if (p.image) {<img [src]="p.image" [alt]="p.name" loading="lazy" (error)="p.image=''">} @else {<span>{{p.name.charAt(0)}}</span>}
    @if (p.featured) {<b class="tag">Destacado</b>}@if (!p.available) {<b class="tag off">Agotado</b>}</div>
   <div class="pbody"><small>{{p.category}}</small><h3>{{p.name}}</h3><p>{{p.description}}</p>
    <div class="prow"><strong>{{priceLabel(p)}}</strong>@if (p.available) {<a class="btn sm" [href]="waLink(p)" target="_blank" rel="noopener">Pedir ↗</a>}</div></div>
  </article>} @empty {<p class="state">No hay productos en esta categoría.</p>}
 </div>}</section>
 <section id="proceso" class="process"><div class="wrap process-inner"><div><div class="eyebrow">02 — CÓMO PEDIR</div><h2>Pedir es <em>fácil.</em></h2><p class="intro">Tres pasos para tener lo que quieres.</p></div><div class="steps"><article><b>01</b><div><h3>Elige tu producto</h3><p>Explora el catálogo y filtra por categoría.</p></div>↗</article><article><b>02</b><div><h3>Escríbenos por WhatsApp</h3><p>Con un clic enviamos el nombre del producto para confirmar tu pedido.</p></div>↗</article><article><b>03</b><div><h3>Recíbelo</h3><p>Coordinamos pago y entrega contigo.</p></div>↗</article></div></div></section>
 <section id="contacto" class="section wrap"><div class="contact"><div><div class="eyebrow">✳ &nbsp; 03 — PEDIDOS</div><h2>¿Listo para <em>pedir?</em></h2><p>Escríbenos por WhatsApp y te respondemos lo antes posible.</p></div><div class="cta-box"><a class="btn" [href]="waGeneral" target="_blank" rel="noopener">Escribir por WhatsApp ↗</a></div></div></section></main>
 <footer class="footer wrap"><a class="logo" href="#">✳ nova<span>.</span></a><p>Catálogo actualizado desde Google Sheets.</p><small>© 2026 NOVA. TODOS LOS DERECHOS RESERVADOS.</small></footer>`
})
export class AppComponent implements OnInit {
 menuOpen=false;
 status: 'loading'|'ready'|'error'='loading';
 products: Product[]=[];
 category='Todos';
 demo=!CONFIG.sheetCsvUrl;
 waGeneral=`https://wa.me/${CONFIG.whatsapp}`;
 private money=new Intl.NumberFormat(CONFIG.locale,{style:'currency',currency:CONFIG.currency,maximumFractionDigits:0});

 get categories(): string[] { return ['Todos',...new Set(this.products.map(p=>p.category))]; }
 get filtered(): Product[] { return this.category==='Todos'?this.products:this.products.filter(p=>p.category===this.category); }
 priceLabel(p: Product): string { return p.price!==null?this.money.format(p.price):(p.priceText||'Consultar'); }
 waLink(p: Product): string { return `${this.waGeneral}?text=${encodeURIComponent(CONFIG.orderMessage+p.name)}`; }

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
