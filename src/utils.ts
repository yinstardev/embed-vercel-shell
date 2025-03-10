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
  if (!viewConfig) {
    return { ...DEFAULT_VIEW_CONFIG };
  }

  let mergedConfig = { ...viewConfig }; 

  mergedConfig.additionalFlags = [
    ...DEFAULT_VIEW_CONFIG.additionalFlags,
    ...(viewConfig.additionalFlags ? viewConfig.additionalFlags : []),
  ];

  if (viewConfig.defaultActionsDisabled) {
    return mergedConfig;
  }

  if (viewConfig.visibleActions && Array.isArray(viewConfig.visibleActions)) {
    mergedConfig.visibleActions = [
      ...DEFAULT_VIEW_CONFIG.visibleActions,
      ...viewConfig.visibleActions,
    ];
  }

  return mergedConfig;
};