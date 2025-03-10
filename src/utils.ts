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
  if(!viewConfig) {
    return { ...DEFAULT_VIEW_CONFIG};
  }

  let updatedConfig = viewConfig;

  updatedConfig.additionalFlags = [
    ...DEFAULT_VIEW_CONFIG.additionalFlags,
    ...(viewConfig.additionalFlags ? viewConfig.additionalFlags : []),
  ]; 
  if (viewConfig.defaultActionsDisabled) {
    return updatedConfig;
  }

  updatedConfig.visibleActions = [
    ...DEFAULT_VIEW_CONFIG.visibleActions,
    ...(viewConfig.visibleActions ? viewConfig.visibleActions : []),
  ];  

  return updatedConfig;
};