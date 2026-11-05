@AGENTS.md

# Gravitación

App web que enseña la ley de gravitación universal de Newton a personas adultas sin formación en física, con un modelo de lenguaje integrado en el aprendizaje y una galería de seis soluciones periódicas del problema de los tres cuerpos.

Datos de las órbitas: `docs/orbitas.md`. Decisiones: `docs/decisiones.md`.

## Criterios del proyecto

Estos criterios mandan sobre cualquier otra preferencia:

* Cada decisión relevante necesita una razón y un coste conocido. Regístrala en `docs/decisiones.md`: contexto, alternativas descartadas, decisión y coste.
* Prefiere código fácil de explicar a código ingenioso. Sin abstracciones sin uso real.
* Acotar vale más que abarcar. Si algo queda fuera o tiene un límite, se dice en el README. Nada a medias sin mencionar.
* Los mínimos del enunciado van antes que cualquier extra.
* El acabado visual y la claridad de la navegación son parte del trabajo, no un remate final.

## Stack

* Obligatorio: TypeScript, Next.js (App Router) y pnpm.
* Tailwind CSS para estilos. Canvas 2D para las simulaciones.
* Física propia en TypeScript puro, sin motor externo: es el núcleo del proyecto.
* Modelo de lenguaje solo desde el servidor, en un Route Handler.
* Vitest para lógica, Playwright y axe para flujos y accesibilidad.
* Justifica en `docs/decisiones.md` cualquier dependencia nueva.

## Comandos

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

`test:e2e` construye la app y corre contra el build de producción.

## Arquitectura

* `src/lib/physics/`: funciones puras sin React, DOM ni Next. Tipos, integrador, energía, órbitas.
* `src/lib/ai/`: prompts, herramientas del modelo y esquemas Zod.
* `src/features/`: `learn` (Parte A) y `gallery` (Parte B).
* `src/components/`: UI compartida.
* `src/app/`: rutas y composición, con la mínima lógica posible.

Server Components por defecto. `"use client"` solo donde haya interacción, y lo más abajo posible en el árbol.

## Física

* Unidades de las órbitas: G = 1 y masas iguales a 1.
* Separa integración y renderizado. El bucle de `requestAnimationFrame` nunca decide el paso físico.
* Las órbitas son inestables: integrar en vivo de forma indefinida hace que se desvíen. Las medidas están en `docs/orbitas.md`. La reproducción debe recorrer en bucle un periodo precalculado con alta precisión.
* No digas en la interfaz que estas órbitas son exactas o eternas en la práctica sin matizarlo. La simulación numérica y el redondeo de las condiciones iniciales tienen límites, y deben quedar explicados.
* Cada órbita necesita un test de cierre tras un periodo y de conservación de energía, con tolerancias justificadas.
* No cambies condiciones iniciales ni tolerancias para que pase un test. Averigua la causa.

## Modelo de lenguaje

* Usa el skill `claude-api` antes de tocar esta integración, y verifica el API del SDK instalado.
* El identificador del modelo se configura por variable de entorno.
* Valida con Zod toda entrada del cliente y toda llamada a herramientas. El modelo solo opera la app por herramientas tipadas con límites físicos definidos.
* El endpoint es público: limita tamaño de entrada, longitud de conversación, tokens de salida y frecuencia. Documenta qué protege cada límite y qué no.
* Sin clave o con error del proveedor, la interfaz muestra un estado de error claro. Nunca respuestas simuladas. La simulación manual sigue funcionando.

## Interfaz

* Móvil y escritorio son igual de importantes. Comprueba 375 px y 1440 px en el navegador real.
* Teclado completo, foco visible y contraste AA, también en los controles de la simulación.
* Canvas con alternativa textual. Respeta `prefers-reduced-motion`.
* Pausa las animaciones fuera de pantalla. En la galería no debe haber seis bucles compitiendo sin control.
* Al volver de un detalle a la galería se recupera el estado previo, incluido el scroll. Cubre este flujo con un test e2e.
* Cada órbita tiene una URL propia, compartible y renderizable por sí sola.

## Tipado

* `strict` activo. Sin `as` para silenciar al compilador, sin `@ts-ignore` y sin `!` de conveniencia.
* Valida en los bordes (red, URL, respuesta del modelo) y confía en los tipos dentro.
* Uniones discriminadas para los estados de la simulación y del chat.

## Git y entorno

* Commits pequeños en español con formato Conventional Commits.
* El repositorio es público: revisa que no entren secretos.
* `.gitignore` ignora `.env*`. Para versionar `.env.example`, añade `!.env.example`.
* Claude tiene bloqueada la lectura de `.env` y `.env.*`. `.env.local` se gestiona a mano.
* Un hito está cerrado si pasan lint, typecheck, tests y build, y si la app se ha comprobado en el navegador.
