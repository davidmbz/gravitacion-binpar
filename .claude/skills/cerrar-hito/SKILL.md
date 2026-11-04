---
name: cerrar-hito
description: Comprueba y cierra un hito del proyecto antes de hacer commit.
---

Cierra el hito actual en este orden:

1. Ejecuta `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build`. Ejecuta `pnpm test:e2e` si el hito cambia flujos de usuario.
2. Si hay cambios visuales, comprueba la app en el navegador a 375 px y 1440 px, también con teclado.
3. Revisa el diff completo como si fuera el PR de otra persona.
4. Actualiza `docs/decisiones.md`.
5. Explica a David en pocas líneas qué cambia, por qué y qué podrían preguntarle.
6. Propón un mensaje de commit en español.

Si algo falla, informa del comando y del resultado real. No cierres el hito.
