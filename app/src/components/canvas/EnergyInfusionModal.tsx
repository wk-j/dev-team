"use client";

import { useState, useEffect } from "react";
import { api, WorkItem } from "@/lib/api/client";

interface EnergyInfusionModalProps {
  targetMember: {
    id: string;
    name: string;
    energySignatureColor: string;
  };
  onClose: () => void;
  onInfused: (workItem: WorkItem) => void;
}

export function EnergyInfusionModal({
  targetMember,
  onClose,
  onInfused,
}: EnergyInfusionModalProps) {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isInfusing, setIsInfusing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dormant work items (unassigned or dormant state)
  useEffect(() => {
    const fetchDormantItems = async () => {
      try {
        setIsLoading(true);
        const items = await api.getWorkItems({ energyState: "dormant" });
        setWorkItems(items);
      } catch (err) {
        setError("Failed to load work items");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDormantItems();
  }, []);

  const handleInfuse = async () => {
    if (!selectedItem) return;

    setIsInfusing(true);
    setError(null);
    try {
      const workItem = workItems.find(item => item.id === selectedItem);
      
      console.log(`[EnergyInfusion] Assigning work item ${selectedItem} to ${targetMember.name}`);
      
      // Assign the dormant work item to the target member
      // This will kindle it and set them as the primary diver
      const result = await api.assignWorkItem(
        selectedItem,
        targetMember.id,
        `⚡ Energy infused! "${workItem?.title}" has been assigned to you.`
      );
      
      console.log('[EnergyInfusion] Assignment successful');
      onInfused(result.workItem);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to infuse energy";
      console.error('[EnergyInfusion] Assignment failed:', errorMessage, err);
      setError(errorMessage);
    } finally {
      setIsInfusing(false);
    }
  };

  const depthColors = {
    shallow: "#10b981",
    medium: "#fbbf24",
    deep: "#f97316",
    abyssal: "#ef4444",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-void-deep/90 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative glass-panel p-6 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{
                background: `radial-gradient(circle, ${targetMember.energySignatureColor}40, transparent)`,
                border: `2px solid ${targetMember.energySignatureColor}`,
              }}
            >
              ⚡
            </div>
            <div>
              <h2 className="text-nebula text-text-stellar">Infuse Energy</h2>
              <p className="text-dust text-text-muted">
                Transfer work to {targetMember.name}
              </p>
            </div>
          </div>
          <button
            className="text-text-muted hover:text-text-bright transition-colors p-2"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 mb-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-3xl mb-2">✨</div>
              <p className="text-text-muted">Scanning for dormant seeds...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">⚠️</div>
              <p className="text-accent-warning">{error}</p>
            </div>
          ) : workItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🌱</div>
              <p className="text-text-muted">No dormant seeds available</p>
              <p className="text-dust text-text-dim mt-1">
                All work items are already energized
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {workItems.map((item) => {
                const isSelected = selectedItem === item.id;
                const depthColor = depthColors[item.depth] || depthColors.medium;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item.id)}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                      isSelected
                        ? "bg-accent-primary/20 border-accent-primary"
                        : "bg-void-surface/50 border-void-atmosphere hover:border-accent-primary/50"
                    } border`}
                    style={{
                      boxShadow: isSelected
                        ? `0 0 20px ${targetMember.energySignatureColor}30`
                        : undefined,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Seed icon */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                          isSelected ? "animate-pulse" : ""
                        }`}
                        style={{
                          background: isSelected
                            ? `radial-gradient(circle, ${targetMember.energySignatureColor}60, ${targetMember.energySignatureColor}20)`
                            : "rgba(61, 90, 90, 0.5)",
                          border: `2px solid ${
                            isSelected
                              ? targetMember.energySignatureColor
                              : "#3d5a5a"
                          }`,
                        }}
                      >
                        🌱
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium truncate ${
                            isSelected ? "text-text-stellar" : "text-text-bright"
                          }`}
                        >
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-dust text-text-muted truncate mt-0.5">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${depthColor}20`,
                              color: depthColor,
                            }}
                          >
                            {item.depth}
                          </span>
                          {item.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 rounded bg-void-atmosphere text-text-dim"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Selection indicator */}
                      {isSelected && (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: targetMember.energySignatureColor,
                          }}
                        >
                          ✓
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-void-atmosphere">
          <button
            className="flex-1 py-2 px-4 border border-void-atmosphere text-text-muted rounded-lg hover:text-text-bright hover:border-text-muted transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: selectedItem
                ? `${targetMember.energySignatureColor}20`
                : undefined,
              borderColor: selectedItem
                ? targetMember.energySignatureColor
                : undefined,
              color: selectedItem ? targetMember.energySignatureColor : undefined,
              border: `1px solid ${
                selectedItem ? targetMember.energySignatureColor : "transparent"
              }`,
            }}
            disabled={!selectedItem || isInfusing}
            onClick={handleInfuse}
          >
            {isInfusing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚡</span>
                Infusing...
              </span>
            ) : (
              "⚡ Infuse Energy"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
