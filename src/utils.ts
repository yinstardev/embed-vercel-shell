import { Action } from "@thoughtspot/visual-embed-sdk";

const DEFAULT_VIEW_CONFIG = {
  visibleActions: [Action.DrillDown, Action.AddFilter],
  additionalFlags: [
    {
      flipTooltipToContextMenuEnabled: "true",
      contextMenuEnabledOnWhichClick: "left",
    },
  ],
};

export const validateAndMergeViewConfig = (viewConfig: any) => {
  if (viewConfig && viewConfig.defaultActionsDisabled) {
    return { ...viewConfig }; 
  }

  let mergedConfig = { ...DEFAULT_VIEW_CONFIG };

  if (viewConfig) {
    if (viewConfig.visibleActions && Array.isArray(viewConfig.visibleActions)) {
      mergedConfig.visibleActions = [...DEFAULT_VIEW_CONFIG.visibleActions, ...viewConfig.visibleActions];
    }

    if (viewConfig.additionalFlags && Array.isArray(viewConfig.additionalFlags)) {
      mergedConfig.additionalFlags = [...DEFAULT_VIEW_CONFIG.additionalFlags, ...viewConfig.additionalFlags];
    }

    mergedConfig = { ...mergedConfig, ...viewConfig };
  }

  return mergedConfig;
};