import { LAUNCH_LIMITS, type Launch } from "@/lib/physics/moon-launch";
import { secondaryAction } from "./controls";
import { formatSpeed } from "./launch-text";
import { RangeField } from "./scene-controls";

type LaunchControlsProps = {
  launch: Launch;
  isFlying: boolean;
  onChange: (launch: Launch) => void;
  onLaunch: () => void;
};

export function LaunchControls({
  launch,
  isFlying,
  onChange,
  onLaunch,
}: LaunchControlsProps) {
  return (
    <div className="mt-4">
      <p className="text-ink-soft">
        Una velocidad de 1 es la de una órbita circular a esta altura.
      </p>
      <div className="mt-3 space-y-3">
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
        className={`${secondaryAction} mt-3 w-full border-prussian text-prussian`}
      >
        Lanzar la luna
      </button>
    </div>
  );
}
