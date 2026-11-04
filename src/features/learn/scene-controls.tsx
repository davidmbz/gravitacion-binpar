import { SCENE_LIMITS, type Scene } from "./scene";

export type RangeFieldProps = {
  id: string;
  label: string;
  marker?: string;
  limits: { min: number; max: number };
  value: number;
  step?: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
};

export function RangeField({
  id,
  label,
  marker,
  limits,
  value,
  step = 1,
  format = String,
  onChange,
}: RangeFieldProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="flex items-center gap-2">
          {marker && <span aria-hidden="true" className={marker} />}
          {label}
        </label>
        <output htmlFor={id} className="text-lg">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={limits.min}
        max={limits.max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.valueAsNumber)}
        className="h-11 w-full cursor-pointer accent-prussian"
      />
    </div>
  );
}

type SceneControlsProps = {
  scene: Scene;
  onChange: (scene: Scene) => void;
};

export function SceneControls({ scene, onChange }: SceneControlsProps) {
  return (
    <div className="mt-4 space-y-3">
      <RangeField
        id="mass-a"
        label="Masa de A"
        marker="size-3 rounded-full bg-prussian"
        limits={SCENE_LIMITS.mass}
        value={scene.massA}
        onChange={(massA) => onChange({ ...scene, massA })}
      />
      <RangeField
        id="mass-b"
        label="Masa de B"
        marker="size-3 rotate-45 bg-verdigris"
        limits={SCENE_LIMITS.mass}
        value={scene.massB}
        onChange={(massB) => onChange({ ...scene, massB })}
      />
      <RangeField
        id="distance"
        label="Distancia"
        limits={SCENE_LIMITS.distance}
        value={scene.distance}
        onChange={(distance) => onChange({ ...scene, distance })}
      />
    </div>
  );
}
