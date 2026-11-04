import { LAUNCH_LIMITS, type Launch } from "@/lib/physics/moon-launch";
import { formatSpeed } from "./launch-text";
import { RangeField } from "./scene-controls";

type LaunchControlsProps = {
  launch: Launch;
  disabled: boolean;
  isFlying: boolean;
  onChange: (launch: Launch) => void;
  onLaunch: () => void;
};

export function LaunchControls({
  launch,
  disabled,
  isFlying,
  onChange,
  onLaunch,
}: LaunchControlsProps) {
  return (
    <fieldset disabled={disabled} className="border-t border-rule pt-4">
      <legend className="pr-3 text-xl">Prepara el lanzamiento</legend>
      {disabled ? (
        <p className="mt-1 text-ink-soft">
          Responde a la predicción para lanzar.
        </p>
      ) : (
        <p className="mt-1 text-ink-soft">
          Una velocidad de 1 es la de una órbita circular a esta altura.
        </p>
      )}
      <div className="mt-3 space-y-2">
        <RangeField
          id="launch-speed"
          label="Velocidad"
          limits={LAUNCH_LIMITS.speed}
          step={LAUNCH_LIMITS.speed.step}
          value={launch.speed}
          format={formatSpeed}
          onChange={(speed) => onChange({ ...launch, speed })}
        />
        <RangeField
          id="launch-angle"
          label="Ángulo sobre la horizontal"
          limits={LAUNCH_LIMITS.angle}
          step={LAUNCH_LIMITS.angle.step}
          value={launch.angle}
          format={(angle) => `${angle}°`}
          onChange={(angle) => onChange({ ...launch, angle })}
        />
      </div>
      <button
        type="button"
        disabled={isFlying}
        onClick={onLaunch}
        className="mt-3 min-h-11 cursor-pointer bg-prussian px-5 text-paper disabled:cursor-not-allowed disabled:bg-paper-deep disabled:text-ink-soft"
      >
        Lanzar la luna
      </button>
    </fieldset>
  );
}
