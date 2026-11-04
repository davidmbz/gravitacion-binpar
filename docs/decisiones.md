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
* Alternativas descartadas: RK4 o leapfrog de paso fijo, que exigen pasos de ~1e-5 en toda la órbita. Precalcular en build y servir binarios, que añade rutas y formato sin necesidad: integrar un periodo tarda 8–36 ms en un Mac tras calentar el JIT.
* Decisión: DOPRI5 adaptativo con tolerancia 1e-13. El cliente integra al abrir el detalle, y el servidor integra lo mismo al prerenderizar el SVG. Se muestrea a 4096 tramos de tiempo uniforme y se reproduce en bucle con interpolación Hermite.
* Coste: un cálculo síncrono al abrir el detalle, sin medir en móvil real, y la órbita se calcula dos veces. Hermite exige guardar velocidades.

### Condiciones iniciales publicadas, sin refinar

* Contexto: un disparo Gauss-Newton sobre (p1, p2, T) baja el cierre de ~1e-3 a ~1e-11, con Δp ≤ 5e-6 y ΔT ≤ 2e-3. Pero el salto al repetir el bucle es de ~0,2 px en un canvas de 800 px.
* Alternativas descartadas: usar valores refinados, que pierden la trazabilidad con las fuentes y añaden código que la animación no necesita.
* Decisión: mantener los valores publicados. Yin-Yang I usa la variante a porque aguanta más periodos antes de desviarse (20 frente a 15). En posición, las dos variantes cierran igual.
* Coste: el cierre numérico es peor de lo posible. El test de cierre usa un límite visual justificado.

### Estado de la galería al volver del detalle

* Contexto: con Cache Components, Next oculta las rutas con Activity, pero solo guarda 3 por nivel. En back/forward no toca el scroll, y un enlace normal a la galería haría push y subiría al inicio.
* Alternativas descartadas: confiar solo en Activity, que falla tras la expulsión y con enlaces. Guardar todo en `sessionStorage`, que reimplementa lo que el navegador ya hace.
* Decisión: filtro en la URL con `replaceState`, scroll restaurado por el navegador y enlaces a la galería que usan `router.back()` si se llegó desde ella. El foco vuelve a la tarjeta de origen con un efecto.
* Coste: un `Suspense` por `useSearchParams`, y en carga directa con filtro se ven un instante las seis órbitas. El origen vive en memoria del módulo: tras recargar el detalle, la vuelta es una navegación normal, que el enunciado permite.

### Experiencia de Aprende

* Contexto: el público no sabe física, y leer una fórmula no la enseña. La predicción obliga a comprometerse antes de ver el resultado.
* Alternativas descartadas: misiones de lanzar una luna, que enseñan órbitas más que la ley. Editar el exponente de la ley, que exige una base previa.
* Decisión: tres pasos con predicción corregida por la app. Mientras la predicción está pendiente, los controles se bloquean y, en el primer paso, se ocultan las flechas. Cada paso vuelve a la escena inicial (masas 4 y 2, distancia 4), para que ×1 signifique siempre lo mismo.
* Coste: no se puede avanzar sin responder ni cambiar la respuesta, y al cambiar de paso se pierde lo movido en la mesa. Las flechas son lineales con la fuerza, así que los extremos se recortan: arriba se marca que no cabe a escala y abajo hay un mínimo de 5 px. El número siempre es el real.

### Tutor en servidor, sin streaming

* Contexto: el modelo debe explicar y operar la mesa, y el endpoint es público. La física es TypeScript puro, así que el servidor puede validar y calcular el efecto de cada herramienta.
* Alternativas descartadas: streaming, que añade protocolo y estados para respuestas de unas 90 palabras. Ejecutar herramientas en el cliente, que permitiría falsificar resultados. Tool Runner del SDK, que es beta y oculta el bucle.
* Decisión: `messages.create` con un bucle propio de 2 vueltas como máximo. La segunda bloquea las herramientas con `tool_choice: none`. Una sola herramienta, `configurar_escena`, validada con Zod. Con la predicción pendiente no se ofrece, porque revelaría el resultado. El cliente envía identificadores, y el servidor construye el bloque de estado.
* Coste: la persona espera la respuesta completa. Los límites de frecuencia son por instancia. El historial llega del cliente, que podría falsificar turnos del tutor, aunque no el estado de la app.

### Pintado compartido y un solo bucle en la galería

* Contexto: portada, tarjetas y detalle dibujan lo mismo. La galería no debe tener seis bucles compitiendo.
* Alternativas descartadas: un canvas por tarjeta siempre animado, que gasta batería y distrae. Un contexto de React para coordinar tarjetas, que renderiza de más para algo que no es estado de interfaz.
* Decisión: `paint-orbit.ts` concentra el dibujo y el reloj. `card-animator.ts` guarda una sola animación activa: empezar una tarjeta detiene la anterior. Solo se anima con ratón o foco de teclado, nunca con `prefers-reduced-motion`.
* Coste: el módulo tiene estado global. La primera vez que se pasa por una tarjeta se integra su órbita en el hilo principal.

### Encuadre ajustado a cada órbita

* Contexto: un cuadrado centrado desperdiciaba espacio en órbitas alargadas como Butterfly I.
* Alternativas descartadas: ajustar el lienzo exactamente a la órbita, que dejaría una tira de poca altura.
* Decisión: el encuadre sale de los límites reales de la órbita. La proporción del lienzo se limita entre 1 y 2, y SVG y canvas usan el mismo encaje centrado.
* Coste: las órbitas más alargadas dejan aire arriba y abajo.

### Perturbar una órbita

* Contexto: la app dice que estas órbitas son delicadas. Enseñarlo convence más que afirmarlo, pero una animación puede exagerar.
* Alternativas descartadas: mover un solo cuerpo, que desplaza el centro de masas y hace que todo derive. Desplazar los cuerpos 1 y 2 en x, que cambia la energía unas mil veces más en la familia de Šuvakov, y la separación sería sobre todo desfase. Una perturbación de 0,01, con la que Yin-Yang I llega a un choque y el integrador se detiene. Comparar con el bucle del periodo, que mezclaría la perturbación con el error de las condiciones publicadas.
* Decisión: desplazar los cuerpos 1 y 3 una milésima en y, en sentidos opuestos, lo que conserva centro de masas y momento. Se integran original y perturbada con DOPRI5 durante 30 unidades, y se reproducen una vez. Tamaño y duración son fijos, así que un test garantiza que las seis órbitas terminan.
* Coste: una sola dirección y un tiempo limitado, y el texto lo dice. El cálculo bloquea el hilo principal de 53 a 181 ms en un Mac, y hasta 1,3 s con la CPU ralentizada 6×, sin medir en un móvil real. El SVG del servidor cambia de encuadre con `setAttribute`, porque su trazado no llega al cliente como dato.

### Perfil del alumno derivado de las predicciones

* Contexto: el tutor debe adaptarse a lo que la persona demuestra, sin depender del juicio del modelo y sin que el cliente pueda dictarle el perfil.
* Alternativas descartadas: que el modelo mantenga el perfil con una herramienta, que lo haría variable y costaría llamadas. Guardarlo en un estado propio, que podría desincronizarse. Enviar el perfil ya calculado, que permitiría inyectar texto en el prompt.
* Decisión: `deriveProfile` es una función pura de las respuestas. El cliente la usa para mostrar "Lo que has demostrado". Al servidor solo llegan identificadores validados con Zod, y él recalcula el perfil. Cada opción incorrecta nombra su error, y tras un fallo la primera pregunta sugerida apunta a esa respuesta.
* Coste: es una señal débil, una pregunta por concepto y sin reintento, y la interfaz lo dice. El perfil no sobrevive a una recarga. La adaptación del tutor depende de que el modelo siga el prompt, aunque el perfil en sí es determinista.

### Lanzar una luna

* Contexto: falta enseñar por qué la gravedad no hace caer a la Luna, y conectar la ley con las órbitas de la galería.
* Alternativas descartadas: Verlet en vivo, que añadiría un segundo integrador y un bucle físico. Clasificar mirando el tramo integrado, que no vería un choque posterior al tiempo calculado. Una herramienta para que el modelo lance, que añade superficie sin requisito.
* Decisión: planeta fijo y luna de masa despreciable, porque la solución exacta es conocida. Energía y momento angular clasifican el resultado. DOPRI5 calcula 30 unidades de tiempo y se reproduce el tramo hasta que la luna toca el planeta o sale de la mesa. Un test compara los dos caminos en los 169 lanzamientos posibles. El ángulo se limita a ±60° para que el momento angular nunca sea nulo.
* Coste: es un modelo de dos cuerpos con planeta fijo, no una simulación completa. Una órbita muy abierta se corta al salir de la mesa, y un choque posterior al tramo se anuncia sin verse. El paso no ofrece `configurar_escena`: el tutor solo puede proponer valores.
