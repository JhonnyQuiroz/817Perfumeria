import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core';

@Component({
 selector: 'app-root', standalone: true,
 template: `
 <header class="header"><a class="logo" href="#">✳ nova<span>.</span></a>
 <button class="menu" (click)="menuOpen=!menuOpen" aria-label="Abrir menú">☰</button>
 <nav [class.open]="menuOpen"><a href="#beneficios" (click)="menuOpen=false">Beneficios</a><a href="#proceso" (click)="menuOpen=false">Proceso</a><a href="#contacto" (click)="menuOpen=false">Contacto</a><a class="nav-cta" href="#contacto" (click)="menuOpen=false">Empezar ↗</a></nav></header>
 <main>
 <section class="hero wrap"><div class="copy"><div class="eyebrow">✳ &nbsp; IDEAS CON INTENCIÓN. RESULTADOS REALES.</div><h1>Haz que tu próxima gran idea <em>despegue.</em></h1><p>Una experiencia digital clara, moderna y pensada para convertir visitantes en oportunidades.</p><div class="actions"><a class="btn" href="#contacto">Hablemos de tu proyecto ↗</a><a class="link" href="#beneficios">Descubre cómo funciona ↓</a></div><div class="proof"><b>JD</b><b>AM</b><b>CR</b><span>Ideas que conectan<br><strong>Diseñadas para avanzar contigo.</strong></span></div></div>
 <div class="art"><div class="glow"></div><div class="float top">✦ &nbsp; <span>CREATIVIDAD<br><strong>Sin límites</strong></span></div><div class="dashboard"><small>OVERVIEW &nbsp; <i>● EN VIVO</i></small><h3>Tu siguiente nivel</h3><svg viewBox="0 0 420 180" role="img" aria-label="Gráfica ascendente"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#a99aff" stop-opacity=".55"/><stop offset="1" stop-color="#a99aff" stop-opacity="0"/></linearGradient></defs><path d="M0 145 Q50 130 85 125 T165 112 T245 85 T330 52 T420 12 V180 H0Z" fill="url(#fill)"/><path d="M0 145 Q50 130 85 125 T165 112 T245 85 T330 52 T420 12" fill="none" stroke="#b5a8ff" stroke-width="4" stroke-linecap="round"/></svg><footer>◉ Progreso <b>En movimiento ↗</b></footer></div><div class="float bottom">↗ &nbsp; <span>PRÓXIMO PASO<br><strong>Vamos por más</strong></span></div><div class="art-note">MENOS RUIDO. MÁS IMPACTO.</div></div><div class="scroll">01 / 03　 ━━━━━　 DESLIZA PARA EXPLORAR ↓</div></section>
 <section class="strip"><span>UNA BASE SÓLIDA PARA CRECER</span><b>✳ Estrategia</b><b>◈ Diseño</b><b>⌁ Tecnología</b><b>↗ Crecimiento</b></section>
 <section id="beneficios" class="section wrap"><div class="eyebrow">01 — LO QUE NOS MUEVE</div><h2>Todo empieza con una <em>buena idea.</em></h2><p class="intro">Una presencia digital efectiva combina claridad, confianza y una experiencia que invita a dar el siguiente paso.</p><div class="cards"><article><i>✧</i><small>01</small><h3>Diseño con propósito</h3><p>Cada sección tiene una razón de ser: comunicar tu valor y guiar al visitante.</p><a href="#contacto">Explorar ↗</a></article><article class="highlight"><i>⌁</i><small>02</small><h3>Experiencia fluida</h3><p>Una navegación sencilla, adaptable a móviles y agradable en cualquier pantalla.</p><a href="#contacto">Explorar ↗</a></article><article><i>◉</i><small>03</small><h3>Enfoque en resultados</h3><p>Mensajes directos y llamadas a la acción que facilitan el contacto.</p><a href="#contacto">Explorar ↗</a></article></div></section>
 <section id="proceso" class="process"><div class="wrap process-inner"><div><div class="eyebrow">02 — EL PROCESO</div><h2>De la idea a la <em>acción.</em></h2><p class="intro">Un camino simple para transformar una intención en algo tangible.</p></div><div class="steps"><article><b>01</b><div><h3>Conocemos tu objetivo</h3><p>Entendemos qué quieres lograr y a quién quieres llegar.</p></div>↗</article><article><b>02</b><div><h3>Diseñamos la experiencia</h3><p>Organizamos el mensaje y creamos una experiencia coherente.</p></div>↗</article><article><b>03</b><div><h3>Salimos al mundo</h3><p>Publicamos, medimos y aprendemos para seguir mejorando.</p></div>↗</article></div></div></section>
 <section id="contacto" class="section wrap"><div class="contact"><div><div class="eyebrow">✳ &nbsp; 03 — SIGUIENTE PASO</div><h2>¿Listo para hacer que <em>pase?</em></h2><p>Cuéntanos un poco sobre tu idea. Este formulario es una demostración y todavía no envía datos a un servidor.</p><p class="note">✳ Una buena conversación puede ser el comienzo.</p></div><form (submit)="submitForm($event)"><label for="name">Tu nombre</label><input id="name" name="name" placeholder="¿Cómo te llamas?" required><label for="email">Correo electrónico</label><input id="email" name="email" type="email" placeholder="tu@correo.com" required><label for="message">¿Qué tienes en mente?</label><textarea id="message" name="message" rows="3" placeholder="Cuéntanos brevemente..." required></textarea><button class="btn" type="submit">Enviar mensaje ↗</button><p class="feedback" [class.show]="submitted" aria-live="polite">{{feedback}}</p></form></div></section></main>
 <footer class="footer wrap"><a class="logo" href="#">✳ nova<span>.</span></a><p>Una landing de demostración creada con Angular.</p><small>© 2026 NOVA. HECHO PARA EXPLORAR.</small></footer>`
})
export class AppComponent {
 menuOpen=false; submitted=false; feedback='';
 submitForm(event: Event): void {
  event.preventDefault();
  const form=event.target as HTMLFormElement;
  if (!form.reportValidity()) return;
  this.submitted=true;
  this.feedback='¡Gracias! La interacción funciona. Conecta un backend o servicio de formularios para recibir mensajes.';
  form.reset();
 }
}
bootstrapApplication(AppComponent).catch((error: unknown)=>console.error(error));
