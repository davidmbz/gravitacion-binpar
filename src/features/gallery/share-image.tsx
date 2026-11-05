import { ImageResponse } from "next/og";
import { BODY_COLORS } from "./paint-orbit";
import { viewBoxOf, type Trajectory } from "./trajectory";

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 };
export const SHARE_IMAGE_TYPE = "image/png";

/** Con este paso, el trazado cabe de sobra en el límite de 500 KB de la imagen. */
export const SHARE_IMAGE_MIN_STEP = 0.01;

const PAPER = "#eef0e8";
const INK = "#1b2233";
const INK_SOFT = "#4a5263";

const FIGURE_SIZE = 550;

type ShareImageProps = {
  title: string;
  titleSize: number;
  subtitle: string;
  trajectory: Trajectory;
};

/** Imagen para compartir: texto a la izquierda y la órbita a la derecha. */
export function renderShareImage({
  title,
  titleSize,
  subtitle,
  trajectory,
}: ShareImageProps): ImageResponse {
  const { frame, paths } = trajectory;
  // Esta imagen no respeta la proporción del viewBox: la estiraría hasta llenar
  // el SVG. Por eso el SVG toma las proporciones de la órbita.
  const longestSide = Math.max(frame.width, frame.height);
  const figureWidth = (frame.width / longestSide) * FIGURE_SIZE;
  const figureHeight = (frame.height / longestSide) * FIGURE_SIZE;
  // El grosor va en unidades de la órbita, así se ve igual en todas.
  const strokeWidth = longestSide / 350;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 40,
        backgroundColor: PAPER,
        color: INK,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 520 }}>
        <div style={{ fontSize: 30, color: INK_SOFT }}>Gravitación</div>
        <div style={{ fontSize: titleSize, lineHeight: 1.1, marginTop: 16 }}>
          {title}
        </div>
        <div style={{ fontSize: 30, color: INK_SOFT, marginTop: 24 }}>
          {subtitle}
        </div>
      </div>
      <svg
        width={figureWidth}
        height={figureHeight}
        viewBox={viewBoxOf(frame)}
        xmlns="http://www.w3.org/2000/svg"
      >
        {paths.map((path, body) => (
          <path
            key={path}
            d={path}
            fill="none"
            stroke={BODY_COLORS[body]}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>,
    SHARE_IMAGE_SIZE,
  );
}
