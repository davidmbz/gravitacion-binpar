---
name: preparar-entrega
description: Audita el proyecto contra los requisitos antes de publicarlo.
disable-model-invocation: true
---

Audita la entrega sin publicar nada:

1. Recorre los requisitos y marca cada punto con evidencia: test, ruta o comprobación manual. Lo que no tenga evidencia queda sin cumplir.
2. Ejecuta lint, typecheck, tests, e2e y build.
3. Revisa que el README incluya ejecución, URL pública, credenciales, decisiones técnicas, límites y uso de IA.
4. Sigue el README desde un clon limpio.
5. Busca secretos en el código y en toda la historia de Git.
6. Si hay URL pública, prueba la versión desplegada, incluidas una URL directa de órbita y una respuesta real del modelo.
7. Revisa el código con ojo crítico: decisiones sin coste declarado, tipos débiles y límites sin mencionar.

Devuelve una lista de bloqueantes, una de mejoras opcionales y tu veredicto. Push, despliegue y envío se deciden a mano.
