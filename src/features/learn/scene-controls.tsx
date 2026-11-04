import { SCENE_LIMITS, type Scene } from "./scene";

type RangeFieldProps = {
  id: string;
  label: string;
  marker?: string;
  limits: { min: number; max: number };
  value: number;
  onChange: (value: number) => void;
};

function RangeField({
  id,
  label,
  marker,
  limits,
  value,
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
          {value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={limits.min}
        max={limits.max}
        step={1}
        value={value}
        onChange={(event) => onChange(event.target.valueAsNumber)}
        className="h-8 w-full accent-prussian"
      />
    </div>
  );
}

type SceneControlsProps = {
  scene: Scene;
  disabled: boolean;
  onChange: (scene: Scene) => void;
};

export function SceneControls({
  scene,
  disabled,
  onChange,
}: SceneControlsProps) {
  return (
    <fieldset disabled={disabled} className="border-t border-rule pt-4">
      <legend className="pr-3 text-xl">Mueve la escena</legend>
      {disabled && (
        <p className="mt-1 text-ink-soft">
          Responde a la predicción para mover los controles.
        </p>
      )}
      <div className="mt-3 space-y-2">
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
    </fieldset>
  );
}
