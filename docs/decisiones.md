# Decisiones técnicas

Una entrada por decisión relevante. Este registro alimenta el README y la preparación de la entrevista.

## Plantilla

### Título

* Contexto:
* Alternativas descartadas:
* Decisión:
* Coste:

## Registro

### Dependencias de la base

* Contexto: el stack exige validar entradas, llamar al modelo y probar lógica, flujos y accesibilidad.
* Alternativas descartadas: `fetch` directo a la API, que obliga a reimplementar tipos y errores del SDK.
* Decisión: `@anthropic-ai/sdk` y `zod` en producción. `vitest`, `@playwright/test` y `@axe-core/playwright` en desarrollo.
* Coste: el SDK solo se usa en servidor, pero es una dependencia más que mantener al día.

### Integrador y reproducción de las órbitas

* Contexto: las órbitas tienen encuentros cercanos (distancia mínima ~0,01, velocidad ~10) y son inestables, así que no se pueden integrar en vivo sin límite.
* Alternativas descartadas: RK4 o leapfrog de paso fijo, que exigen pasos de ~1e-5 en toda la órbita. Precalcular en build y servir binarios, que añade rutas y formato sin necesidad: integrar un periodo tarda 8–27 ms en un Mac tras calentar el JIT.
* Decisión: DOPRI5 adaptativo con tolerancia 1e-13, integrando en cliente al abrir el detalle. Se muestrea a 4096 tramos de tiempo uniforme y se reproduce en bucle con interpolación Hermite.
* Coste: un cálculo síncrono al abrir el detalle, sin medir en móvil real. Hermite exige guardar velocidades.

### Condiciones iniciales publicadas, sin refinar

* Contexto: un disparo Gauss-Newton sobre (p1, p2, T) baja el cierre de ~1e-3 a ~1e-11, con Δp ≤ 5e-6 y ΔT ≤ 2e-3. Pero el salto al repetir el bucle es de ~0,2 px en un canvas de 800 px.
* Alternativas descartadas: usar valores refinados, que pierden la trazabilidad con las fuentes y añaden código que la animación no necesita.
* Decisión: mantener los valores publicados. Yin-Yang I usa la variante a porque cierra mejor (5,5e-4 frente a 8,6e-4) y aguanta más periodos (20 frente a 15).
* Coste: el cierre numérico es peor de lo posible. El test de cierre usa un límite visual justificado.

### Estado de la galería al volver del detalle

* Contexto: con Cache Components, Next oculta las rutas con Activity, pero solo guarda 3 por nivel. En back/forward no toca el scroll, y un enlace normal a la galería haría push y subiría al inicio.
* Alternativas descartadas: confiar solo en Activity, que falla tras la expulsión y con enlaces. Guardar todo en `sessionStorage`, que reimplementa lo que el navegador ya hace.
* Decisión: filtro en la URL con `replaceState`, scroll restaurado por el navegador y enlaces a la galería que usan `router.back()` si se llegó desde ella. El foco vuelve a la tarjeta de origen con un efecto.
* Coste: un `Suspense` por `useSearchParams`, y en carga directa con filtro se ven un instante las seis órbitas. El origen vive en memoria del módulo: tras recargar el detalle, la vuelta es una navegación normal, que el enunciado permite.
