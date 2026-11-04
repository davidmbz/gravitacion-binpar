---
name: preparar-entrega
description: Audita el proyecto contra el enunciado antes de enviarlo a BinPar.
disable-model-invocation: true
---

Audita la entrega sin publicar nada:

1. Recorre el enunciado de BinPar y marca cada punto con evidencia: test, ruta o comprobación manual. Lo que no tenga evidencia queda sin cumplir.
2. Ejecuta lint, typecheck, tests, e2e y build.
3. Revisa que el README incluya ejecución, URL pública, credenciales, decisiones técnicas, límites y uso de IA.
4. Sigue el README desde un clon limpio.
5. Busca secretos en el código y en toda la historia de Git.
6. Si hay URL pública, prueba la versión desplegada, incluidas una URL directa de órbita y una respuesta real del modelo.
7. Revisa el código como lo haría quien entrevista: decisiones sin coste declarado, tipos débiles y límites sin mencionar.

Devuelve una lista de bloqueantes, una de mejoras opcionales y tu veredicto. Push, despliegue y envío los decide David.
