import { Action } from "@thoughtspot/visual-embed-sdk";

const DEFAULT_CONFIG = {
    visibleActions : [
      Action.AddFilter, Action.DrillDown
    ],
    additionalFlags : {
      flipTooltipToContextMenuEnabled: "true",
      contextMenuEnabledOnWhichClick: "left",
    }
  }

export const validateAndMergeViewCOnfig = (viewConfig: any) => {
    alert(`Coming here : ${viewConfig}`)
    if(viewConfig.additionalFlags) {
      viewConfig.additionalFlags = {...viewConfig.additionalFlags, ...DEFAULT_CONFIG.additionalFlags};
    } else {
      viewConfig.additionalFlags = {...DEFAULT_CONFIG.additionalFlags};
    }
    if(!viewConfig.hiddenActions && !viewConfig.visibleActions) {
        viewConfig.visibleActions = DEFAULT_CONFIG.visibleActions;
    }
    alert(`viewConfig final : ${JSON.stringify(viewConfig)}`);
    return viewConfig;
  }