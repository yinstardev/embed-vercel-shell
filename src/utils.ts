import { Action } from "@thoughtspot/visual-embed-sdk";

const DEFAULT_CONFIG = {
  fullHeight: true,
  visibleActions: [Action.AddFilter,Action.CrossFilter, Action.DrillDown, Action.PersonalisedViewsDropdown, Action.AxisMenuFilter, Action.AxisMenuEdit, Action.AxisMenuPosition, 
      Action.AxisMenuSort, Action.AxisMenuAggregate, Action.AxisMenuConditionalFormat, Action.AxisMenuGroup, Action.AxisMenuRemove,
      Action.AxisMenuRename, Action.AxisMenuTimeBucket
  ], 
  additionalFlags: {
    "contextMenuEnabledOnWhichClick": "left",
    "isLiveboardNewBreakPointsEnabled": "true"
  },
};

export const validateAndMergeViewConfig = (viewConfig: any) => {
  viewConfig.additionalFlags = {
    ...DEFAULT_CONFIG.additionalFlags,
    ...(viewConfig.additionalFlags || {}),
  };

  if (!viewConfig.hiddenActions && !viewConfig.visibleActions) {
    viewConfig.visibleActions = DEFAULT_CONFIG.visibleActions;
  }
  viewConfig.fullHeight = DEFAULT_CONFIG.fullHeight;
  return viewConfig;
}
