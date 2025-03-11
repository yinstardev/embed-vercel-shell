import { Action } from "@thoughtspot/visual-embed-sdk";

const DEFAULT_CONFIG = {
    visibleActions: [Action.AddFilter, Action.DrillDown],
    additionalFlags: {
      "contextMenuEnabledOnWhichClick": "left",
    },
  };

export const validateAndMergeViewCOnfig = (viewConfig: any) => {
    viewConfig.additionalFlags = {
        ...DEFAULT_CONFIG.additionalFlags,
        ...(viewConfig.additionalFlags || {}),
      };
    
      if (!viewConfig.hiddenActions && !viewConfig.visibleActions) {
        viewConfig.visibleActions = DEFAULT_CONFIG.visibleActions;
      } 
    alert(`viewConfig final : ${JSON.stringify(viewConfig)}`);
    return viewConfig;
  }