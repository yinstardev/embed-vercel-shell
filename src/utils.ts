import { Action } from "@thoughtspot/visual-embed-sdk"

export const validateAndMergeViewConfig = (viewConfig: any) => {
    if(viewConfig.defaultActionsDisabled) {
        return viewConfig;
    }

    if(viewConfig.visibleActions){
        viewConfig.visibleActions = [...viewConfig.visibleActions, Action.DrillDown, Action.AddFilter];
    }

    if(viewConfig.additionalFlags){
        viewConfig.additionalFlags = [...viewConfig.additionalFlags, {
            "flipTooltipToContextMenuEnabled": "true",
            "contextMenuEnabledOnWhichClick": "left",
        }];
    }

    const defaultViewConfig = {
        visibleActions: [Action.DrillDown, Action.AddFilter],
        additionalFlags: [
            {
                "flipTooltipToContextMenuEnabled": "true",
                "contextMenuEnabledOnWhichClick": "left",
            }
        ]
    }

    if (!viewConfig) {
        return defaultViewConfig;
    }

    return { ...defaultViewConfig, ...viewConfig };
}