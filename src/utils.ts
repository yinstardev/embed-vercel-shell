import { Action } from "@thoughtspot/visual-embed-sdk";

const DEFAULT_CONFIG = {
    fullHeight: true,
    visibleActions: [Action.AddFilter, Action.DrillDown],
    additionalFlags: {
        "contextMenuEnabledOnWhichClick": "left",
        "isMobileResponsiveLiveboardEnabled": true
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
    viewConfig.fullHeight = DEFAULT_CONFIG.fullHeight;
    alert(`viewConfig final : ${JSON.stringify(viewConfig)}`);
    return viewConfig;
}
