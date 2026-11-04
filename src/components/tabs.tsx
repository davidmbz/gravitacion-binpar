"use client";

import { useRef, type KeyboardEvent } from "react";

export type Tab<Id extends string> = { id: Id; label: string };

type TabListProps<Id extends string> = {
  label: string;
  tabs: readonly Tab<Id>[];
  active: Id;
  /** Prefijo de los id, para enlazar cada pestaña con su panel. */
  idPrefix: string;
  onChange: (id: Id) => void;
};

export function tabId(prefix: string, id: string): string {
  return `${prefix}-tab-${id}`;
}

export function tabPanelId(prefix: string, id: string): string {
  return `${prefix}-panel-${id}`;
}

/**
 * Patrón de pestañas de WAI-ARIA: una sola parada de tabulador, y las flechas
 * mueven el foco y activan la pestaña. Los paneles los pinta quien la usa.
 */
export function TabList<Id extends string>({
  label,
  tabs,
  active,
  idPrefix,
  onChange,
}: TabListProps<Id>) {
  const buttons = useRef(new Map<Id, HTMLButtonElement>());

  function handleKeyDown(event: KeyboardEvent, index: number) {
    const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    const offset = offsets[event.key];
    const target =
      event.key === "Home"
        ? tabs[0]
        : event.key === "End"
          ? tabs[tabs.length - 1]
          : offset === undefined
            ? undefined
            : tabs[(index + offset + tabs.length) % tabs.length];

    if (!target) return;
    event.preventDefault();
    onChange(target.id);
    buttons.current.get(target.id)?.focus();
  }

  return (
    <div role="tablist" aria-label={label} className="flex gap-1">
      {tabs.map((tab, index) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(node) => {
              if (node) buttons.current.set(tab.id, node);
              else buttons.current.delete(tab.id);
            }}
            id={tabId(idPrefix, tab.id)}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={tabPanelId(idPrefix, tab.id)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`min-h-11 cursor-pointer border-b-2 px-3 transition-colors duration-150 ${
              isActive
                ? "border-cinnabar text-ink"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
