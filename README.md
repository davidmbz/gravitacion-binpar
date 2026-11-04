# Gravitación

Aplicación web para entender la ley de gravitación de Newton sin saber física, y para explorar seis órbitas periódicas del problema de los tres cuerpos. Prueba técnica para BinPar.

**Versión online:** https://gravitacion-binpar.vercel.app/

## Qué incluye

* **Aprende (`/aprende`):** dos cuerpos con masas y distancia ajustables, flechas de fuerza y tres pasos: atracción mutua, masa y distancia. En cada paso predices antes de ver el resultado, y la app corrige tu respuesta.
* **Tutor:** un modelo de lenguaje explica el porqué de tus dudas y puede mover la mesa para enseñártelo.
* **Órbitas (`/orbitas`):** Lagrange, Figura de ocho, Butterfly I, Goggles, Moth I y Yin-Yang I. Cada una tiene URL propia, animación y controles de reproducción. Al volver a la galería se conservan el filtro, el scroll y el foco.

## Ejecutar en local

Requisitos: Node 22 y pnpm 11.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Rellena en `.env.local`:

| Variable | Uso |
| --- | --- |
| `ANTHROPIC_API_KEY` | Clave de la API de Anthropic. Solo se usa en el servidor |
| `ANTHROPIC_MODEL` | Identificador del modelo, por ejemplo `claude-opus-5-5` |

Sin estas variables, el tutor muestra un error claro y todo lo demás funciona.

## Comprobaciones

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
```

Para correr los e2e contra la versión publicada, define `E2E_BASE_URL`.

## Decisiones técnicas

El registro completo, con alternativas y costes, está en [docs/decisiones.md](docs/decisiones.md). Lo esencial:

* **Física propia en TypeScript.** Integrador DOPRI5 adaptativo con tolerancia 1e-13. Las órbitas tienen encuentros muy cercanos, y un paso fijo exigiría pasos diminutos en toda la trayectoria.
* **Un periodo calculado, reproducido en bucle.** Estas órbitas son inestables: integrarlas sin límite acaba rompiéndolas. Se muestrean 4096 instantes uniformes y se interpola con Hermite. El bucle de pintado nunca decide un paso físico.
* **Galería sin JavaScript de animación.** Seis SVG generados en el servidor, sin bucles compitiendo.
* **Estado al volver.** El filtro vive en la URL, el scroll lo restaura el navegador y el enlace de vuelta usa el historial. No depende de Activity, que solo guarda tres rutas.
* **Tutor en el servidor.** El modelo solo opera la app con `configurar_escena`, validada con Zod. La corrección de las predicciones nunca depende del modelo.

## Protección del endpoint del tutor

| Límite | Valor | Protege | No protege |
| --- | --- | --- | --- |
| Tamaño del cuerpo | 32 KB | Coste de entrada por petición | Muchas peticiones pequeñas |
| Mensaje | 600 caracteres | Coste de entrada | Lo mismo |
| Conversación | 20 mensajes | Crecimiento del contexto | Un cliente que reinicia el historial |
| Salida | 1500 tokens y 2 vueltas | Coste de salida y bucles | Volumen total |
| Frecuencia | 10 por minuto e IP, en memoria | Ráfagas contra una instancia | Varias instancias o muchas IP |

El límite de frecuencia no es global: en serverless, cada instancia lleva su cuenta. La garantía real de coste es un tope de gasto configurado en la consola de Anthropic para la clave usada.

El alcance temático se pide en el prompt, y el texto de la persona se trata como dato, separado del estado de la app. Es una mitigación, no una garantía: un modelo puede responder fuera de tema. El daño posible está acotado, porque solo dispone de una herramienta con límites físicos. El historial llega del cliente, que podría falsificar turnos anteriores del tutor, pero no el estado de la app. La interfaz avisa de que el texto se envía a un proveedor externo.

## Límites conocidos

**Física**

* Las órbitas no son exactas ni eternas en la práctica. Las condiciones iniciales son valores publicados y redondeados. Con ellos, tras un periodo los cuerpos quedan a unas 6 × 10⁻⁴ unidades del inicio como máximo, unos 0,2 px en un canvas de 800 px.
* Un disparo Gauss-Newton baja ese cierre a ~1e-11 cambiando las condiciones menos de 6e-6 y el periodo menos de 2e-3. No se aplica, para mantener la trazabilidad con las fuentes.
* Li y Liao observaron que al menos siete de las quince órbitas de Šuvakov y Dmitrašinović se alejan de la trayectoria periódica en simulaciones de alta precisión. Butterfly I, Goggles y Yin-Yang I a están entre ellas.
* Lagrange es exacta en teoría, pero es la más inestable de las seis: multiplica una perturbación por ~85 en cada periodo.
* Yin-Yang I usa la variante a, que aguanta más periodos. No se ha contrastado su forma con una imagen de referencia.

**Aplicación**

* El detalle integra en el hilo principal al abrir, sin Worker. En un Mac tarda 8–36 ms. No se ha medido en un móvil real.
* Las flechas de Aprende son lineales con la fuerza. Por encima de lo que cabe se marcan como fuera de escala, y por debajo tienen una longitud mínima. El número siempre es exacto.
* Una órbita desconocida muestra la página de no encontrado con `noindex`. En Vercel responde 404, pero con `next start` local responde 200, porque el streaming ya ha enviado la cabecera.
* El progreso de Aprende y la conversación no sobreviven a una recarga.
* Solo se ha probado en Chromium, sin lector de pantalla real.

**Fuera de alcance por el plazo:** perfil adaptativo del alumno, lanzamiento de una luna, vistas previas animadas en la galería, buscador de órbitas propias, CI, imágenes Open Graph y pruebas multi-navegador.

## Uso de IA

Desarrollado con Claude Code. La IA ayudó a planificar, escribir código y tests, y a auditar la física con un agente revisor independiente. Las decisiones, el alcance y la revisión final son míos. El contexto dado a la herramienta está en `CLAUDE.md` y `.claude/`.

## Fuentes

* Šuvakov y Dmitrašinović, [Three Classes of Newtonian Three-Body Planar Periodic Orbits](https://arxiv.org/abs/1303.0181).
* Li y Liao, [comentario con valores de 15 dígitos](https://arxiv.org/abs/1312.6796).
* Chenciner y Montgomery, [figura de ocho](https://arxiv.org/abs/math/0011268), con valores de Simó.
