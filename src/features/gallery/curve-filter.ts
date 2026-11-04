import type { OrbitCurve } from "@/lib/physics/orbits";

export const CURVE_PARAM = "curva";

export type CurveFilter = "all" | OrbitCurve;

export const CURVE_FILTERS: readonly {
  value: CurveFilter;
  param: string | null;
  label: string;
}[] = [
  { value: "all", param: null, label: "Todas" },
  { value: "shared", param: "compartida", label: "Curva compartida" },
  { value: "separate", param: "propia", label: "Curva propia" },
];

/** La URL es una entrada externa: cualquier valor desconocido equivale a "todas". */
export function parseCurveFilter(param: string | null): CurveFilter {
  return CURVE_FILTERS.find((filter) => filter.param === param)?.value ?? "all";
}

export function curveFilterSearch(filter: CurveFilter): string {
  const param = CURVE_FILTERS.find(({ value }) => value === filter)?.param;
  return param ? `?${CURVE_PARAM}=${param}` : "";
}

export function matchesFilter(curve: OrbitCurve, filter: CurveFilter): boolean {
  return filter === "all" || filter === curve;
}
