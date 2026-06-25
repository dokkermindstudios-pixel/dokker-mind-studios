# Dökker Mind Studios — sitio web

Sitio estático de 5 páginas (HTML/CSS/JS puro, sin dependencias de build).

## Estructura
```
index.html        → Inicio
sobre-mi.html      → Historia / sobre el desarrollador
proyectos.html     → Seguimiento de Kara: Descent of the Berserker y futuros proyectos
donacion.html      → Niveles de apoyo y enlaces a plataformas de donación
contacto.html      → Formulario y canales de contacto
assets/style.css   → Estilos compartidos
assets/script.js   → Menú móvil + partículas de ascuas + feedback de formularios
assets/logo.png    → Tu logo
```

## Cómo publicarlo gratis

### Opción A — GitHub Pages (recomendada, dominio tipo `tu-usuario.github.io/dokker-mind`)
1. Crea una cuenta gratuita en github.com si no tienes una.
2. Crea un repositorio nuevo, por ejemplo `dokker-mind-studios`.
3. Sube todos los archivos de esta carpeta (arrastra y suelta en la interfaz web de GitHub, o usa `git push`).
4. Ve a **Settings → Pages**, elige la rama `main` y la carpeta raíz `/`, guarda.
5. En unos minutos tu sitio estará en `https://tu-usuario.github.io/dokker-mind-studios/`.

### Opción B — Netlify (dominio tipo `dokker-mind.netlify.app`)
1. Crea una cuenta gratuita en netlify.com.
2. Arrastra la carpeta completa del sitio a la zona de "Deploy manually" en el dashboard.
3. Netlify te asigna un subdominio gratuito al instante; puedes cambiarlo por uno más bonito en **Site settings → Change site name**.

### Opción C — Vercel (dominio tipo `dokker-mind.vercel.app`)
1. Crea una cuenta gratuita en vercel.com.
2. Importa el repositorio (si usaste GitHub) o sube la carpeta directamente.
3. Vercel detecta que es un sitio estático y lo publica sin configuración adicional.

Cualquiera de las tres opciones es 100% gratuita, no requiere tarjeta de crédito y te da HTTPS automático.

## Pendiente de personalizar antes de publicar
- **Donación**: reemplaza los enlaces de Ko-fi / Patreon / PayPal en `donacion.html` por tus cuentas reales.
- **Contacto**: el formulario es estático (no envía correos por sí solo). Conéctalo gratis a [Formspree](https://formspree.io) o [Web3Forms](https://web3forms.com) — solo necesitas agregar tu `action` y `endpoint` al `<form>` en `contacto.html`.
- **Redes sociales**: actualiza los datos de contacto en `contacto.html` (correo, X/Twitter, YouTube, Discord) con tus cuentas reales.
- **Proyectos futuros**: edita `proyectos.html` cuando anuncies nuevos proyectos.
