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
