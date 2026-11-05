# Gravitación

Esta es mi prueba técnica para BinPar: una aplicación web para entender la ley de gravitación de Newton sin saber física, y para explorar seis órbitas periódicas del problema de los tres cuerpos.

Versión online: https://gravitacion-binpar.vercel.app/

## Qué incluye

* Aprende (`/aprende`): dos cuerpos con masas y distancia ajustables, flechas de fuerza y cuatro pasos: atracción mutua, masa, distancia y caer sin llegar. Cada paso va por fases: predices, ves el resultado en la mesa y exploras con los controles.
* Lanzar una luna: en el último paso eliges velocidad y ángulo, y ves si orbita, choca o escapa.
* Lo que has demostrado: el cierre del recorrido, con la fórmula completa y un perfil calculado a partir de tus respuestas.
* Tutor: un modelo de lenguaje explica el porqué de tus dudas con ese perfil a la vista, y puede mover la mesa para enseñártelo. Ofrece preguntas sugeridas que cambian según tu respuesta.
* Órbitas (`/orbitas`): Lagrange, Figura de ocho, Butterfly I, Goggles, Moth I y Yin-Yang I. Cada una tiene URL propia, imagen para compartir, animación y controles de reproducción. Al volver a la galería se conservan el filtro, el scroll y el foco. La portada también tiene su imagen para compartir.
* Perturbar una órbita: en el detalle, comparo la órbita con una copia desplazada una milésima y mido cuánto se separan.

### Extras del enunciado

| Extra | Estado |
| --- | --- |
| La experiencia se adapta a lo que el usuario demuestra saber | Hecho: perfil determinista, sugerencias y contexto del tutor |
| El modelo puede operar la aplicación | Hecho: `configurar_escena` |
| El usuario puede buscar órbitas propias | No incluido |

## Decisiones técnicas

El registro completo, con alternativas y costes, está en [docs/decisiones.md](docs/decisiones.md). Resumo aquí las principales.

* Física propia en TypeScript. Uso de un integrador DOPRI5 adaptativo con tolerancia 1e-13. Las órbitas tienen encuentros muy cercanos, y un paso fijo exigiría pasos diminutos en toda la trayectoria.
* Un periodo calculado y reproducido en bucle. Estas órbitas son inestables: integrarlas sin límite acaba rompiéndolas. Muestreo 4096 instantes uniformes e interpolo con Hermite. El bucle de pintado nunca decide un paso físico.
* Galería sin bucles compitiendo. Son seis SVG generados en el servidor. Solo se anima la tarjeta con ratón o foco de teclado, y un único bucle garantiza que no haya dos a la vez.
* Estado al volver. El filtro vive en la URL, el scroll lo restaura el navegador y el enlace de vuelta usa el historial. No dependo de Activity, que solo guarda tres rutas.
* Pantalla completa sin ocultar nada. Aprende, galería y detalle llenan el alto disponible sin `overflow: hidden`. Con un alto mínimo, una ventana baja o un zoom del 200 % recuperan el scroll normal.
* Tutor en el servidor. El modelo solo opera la app con `configurar_escena`, validada con Zod. La corrección de las predicciones nunca depende del modelo.
* Perfil derivado. Es una función pura de las respuestas. Al servidor solo llegan identificadores validados, y él lo recalcula, así que el cliente no puede escribir en el prompt.
* Perturbación comparable. Desplaza dos cuerpos en sentidos opuestos para conservar el centro de masas. Original y perturbada se integran igual, durante el mismo tiempo.
* Luna clasificada de forma exacta. Energía y momento angular dicen si orbita, choca o escapa. DOPRI5 dibuja la trayectoria, y un test comprueba que ambos coinciden en los 169 lanzamientos posibles.

## Protección del endpoint del tutor

| Límite | Valor | Protege | No protege |
| --- | --- | --- | --- |
| Tamaño del cuerpo | 32 KB | Coste de entrada por petición | Muchas peticiones pequeñas |
| Mensaje | 600 caracteres | Coste de entrada | Lo mismo |
| Conversación | 20 mensajes | Crecimiento del contexto | Un cliente que reinicia el historial |
| Salida | 1500 tokens y 2 vueltas | Coste de salida y bucles | Volumen total |
| Frecuencia | 10 por minuto e IP, en memoria | Ráfagas contra una instancia | Varias instancias o muchas IP |

El límite de frecuencia no es global: en serverless, cada instancia lleva su cuenta. La garantía real de coste es un tope de gasto configurado en la consola de Anthropic para la clave usada.

El alcance temático se pide en el prompt, y el texto de la persona se trata como dato, separado del estado de la app. Esto lo mitiga, pero no lo garantiza: un modelo puede responder fuera de tema. El daño posible está acotado, porque solo dispone de una herramienta con límites físicos. El historial llega del cliente, que podría falsificar turnos anteriores del tutor, pero no el estado de la app. La interfaz avisa de que el texto se envía a un proveedor externo.

## Límites conocidos

### Física

* Las órbitas no son exactas ni eternas en la práctica. Las condiciones iniciales son valores publicados y redondeados. Con ellos, tras un periodo los cuerpos quedan a unas 6 × 10⁻⁴ unidades del inicio como máximo, unos 0,2 px en un canvas de 800 px.
* Un disparo Gauss-Newton baja ese cierre a ~1e-11 cambiando las condiciones menos de 6e-6 y el periodo menos de 2e-3. No lo aplico, para mantener la trazabilidad con las fuentes.
* Li y Liao observaron que al menos siete de las quince órbitas de Šuvakov y Dmitrašinović se alejan de la trayectoria periódica en simulaciones de alta precisión. Butterfly I, Goggles y Yin-Yang I a están entre ellas.
* Lagrange es exacta en teoría, pero es la más inestable de las seis: multiplica una perturbación por ~85 en cada periodo.
* Yin-Yang I usa la variante a, que aguanta más periodos. No he contrastado su forma con una imagen de referencia.

### Simulaciones interactivas

* La perturbación usa una sola dirección y un tiempo limitado. Muestra un caso y no sirve para medir la estabilidad de la órbita. Parte de la separación puede ser desfase, sobre todo en la figura de ocho.
* El lanzamiento usa un planeta fijo y una luna de masa despreciable. Una órbita muy abierta se corta al salir de la mesa, y un choque posterior al tramo calculado se anuncia sin verse.

### Aplicación

* Las órbitas se integran en el hilo principal, sin Worker. Abrir el detalle tarda 8–36 ms en un Mac. Perturbar tarda de 53 a 181 ms, y hasta 1,3 s con la CPU ralentizada 6×, con un aviso visible. También lo he probado y medido en un móvil real.
* Las flechas de Aprende son lineales con la fuerza. Por encima de lo que cabe se marcan como fuera de escala, y por debajo tienen una longitud mínima. El número siempre es exacto.
* En una mesa muy baja, como un móvil en horizontal, los cuerpos se dibujan más pequeños y la mesa no llena todo el ancho.
* "Lo que has demostrado" se basa en una pregunta por concepto, sin reintento. Es una señal débil, y la interfaz lo dice.
* La adaptación del tutor depende de que el modelo siga el prompt. El perfil sí es determinista.
* El progreso de Aprende y la conversación no sobreviven a una recarga.
* He probado el teclado en un móvil real, y en los e2e lo simulo reduciendo la ventana. En iOS, el ajuste depende de `visualViewport`. Al escribir en móvil, la mesa se oculta para dejar sitio al campo.
* Al filtrar la galería en móvil puede quedar un hueco, porque el orden está pensado para las seis láminas.
* Una órbita desconocida muestra la página de no encontrado con `noindex`. En Vercel responde 404, pero con `next start` local responde 200, porque el streaming ya ha enviado la cabecera.
* Las imágenes para compartir usan la fuente por defecto de `ImageResponse`, distinta de la de la web.
* Los e2e corren en Chromium. Además, he probado y medido la app en diferentes dispositivos.

Fuera de alcance: buscador de órbitas propias, e2e en CI y pruebas multi-navegador automatizadas.

## Uso de IA

He desarrollado este proyecto con Claude Code. Lo usé para planificar, escribir código y tests, además de auditar la física con un agente revisor independiente. Las decisiones, el alcance y la revisión final son míos. El contexto que le di a la herramienta está en `CLAUDE.md` y `.claude/`.

## Fuentes

* Šuvakov y Dmitrašinović, [Three Classes of Newtonian Three-Body Planar Periodic Orbits](https://arxiv.org/abs/1303.0181).
* Li y Liao, [comentario con valores de 15 dígitos](https://arxiv.org/abs/1312.6796).
* Chenciner y Montgomery, [figura de ocho](https://arxiv.org/abs/math/0011268), con valores de Simó.
