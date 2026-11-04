# Datos de las órbitas

Punto de partida para la Parte B. Hay que revalidar estos valores con el integrador del proyecto antes de darlos por buenos.

## Convención

G = 1 y m1 = m2 = m3 = 1.

Familia Šuvakov-Dmitrašinović, parametrizada por (p1, p2):

* Posiciones: r1 = (-1, 0), r2 = (1, 0), r3 = (0, 0).
* Velocidades: v1 = v2 = (p1, p2), v3 = (-2·p1, -2·p2).

## Condiciones iniciales

| Órbita | p1 | p2 | T | Fuente |
| --- | --- | --- | --- | --- |
| Butterfly I (I.A.1) | 0.306892758965492 | 0.125506782829762 | 6.23564136316479 | Li y Liao, 15 dígitos |
| Goggles (I.B.5) | 0.0833000564575194 | 0.127889282226563 | 10.4668176954385 | Li y Liao, 15 dígitos |
| Moth I (I.B.1) | 0.46444 | 0.39606 | 14.8939 | Šuvakov y Dmitrašinović, 5 decimales |
| Yin-Yang I a (II.C.2a) | 0.513938054919243 | 0.304736003875733 | 17.328369755004 | Li y Liao, 15 dígitos |
| Yin-Yang I b (II.C.2b) | 0.282698682308198 | 0.327208786129952 | 10.9625630756217 | Li y Liao, 15 dígitos |

El catálogo tiene dos variantes de Yin-Yang I. Hay que elegir una y justificarlo.

### Figura de ocho

No aparece en estas tablas. Los valores proceden de memoria y solo están validados numéricamente, así que falta localizar y citar una fuente primaria.

* r1 = (0.97000436, -0.24308753), r2 = -r1, r3 = (0, 0)
* v3 = (-0.93240737, -0.86473146), v1 = v2 = -v3 / 2
* T = 6.32591398

### Lagrange

Solución analítica: triángulo equilátero en rotación rígida, derivada para masas iguales.

* Radio R = 1 desde el centro de masas, con los cuerpos a 0°, 120° y 240°.
* Velocidad tangencial v = 3^(-1/4).
* T = 2π · 3^(1/4) ≈ 8.26914

## Medición previa

Integrador DOPRI5 adaptativo con tolerancias de 1e-13, implementado para esta comprobación.

* Cierre: mayor diferencia absoluta entre el estado inicial y el estado en T.
* Periodos hasta desviarse: periodos integrados hasta que una coordenada de posición difiere más de 0.1 de la inicial al final de un periodo. Se probaron 30 como máximo.

| Órbita | Energía | Cierre tras 1 T | Periodos hasta desviarse |
| --- | --- | --- | --- |
| Lagrange | -0.866025 | 1.24e-12 | 8 |
| Figura de ocho | -1.287142 | 3.90e-8 | más de 30 |
| Butterfly I | -2.170195 | 1.21e-3 | 22 |
| Goggles | -2.430116 | 2.46e-3 | 6 |
| Moth I (5 decimales) | -1.382296 | 2.29e-4 | más de 30 |
| Yin-Yang I a | -1.429011 | 5.51e-4 | 20 |
| Yin-Yang I b | -1.939048 | 8.61e-4 | 15 |

## Implicaciones

* Integrar en vivo sin límite acaba rompiendo la órbita, incluso la de Lagrange. Por eso se reproduce un periodo precalculado.
* El cierre de 1e-3 puede producir un pequeño salto al repetir el bucle. Hay que comprobar si se nota a la escala de pantalla. Si se nota, se pueden refinar las condiciones con un método de disparo.
* Hay encuentros cercanos, así que hace falta paso adaptativo y remuestreo a tiempo uniforme para que la animación tenga velocidad constante.
* Li y Liao informan de que varias de estas órbitas dejan de ser periódicas en sus simulaciones de alta precisión. Es un límite real que conviene explicar en la app y en el README.
* Moth I es la órbita con menos precisión: buscar mejores valores o refinarlos.

## Fuentes

* Šuvakov y Dmitrašinović, Three Classes of Newtonian Three-Body Planar Periodic Orbits: https://arxiv.org/abs/1303.0181
* Li y Liao, comentario con valores de 15 dígitos: https://arxiv.org/abs/1312.6796
