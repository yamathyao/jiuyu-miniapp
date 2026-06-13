const FRIEND_SHARE_TITLE = "方庭九屿：一款本地优先的数独微信小游戏";
const TIMELINE_SHARE_TITLE = "方庭九屿｜本地优先的数独小游戏";

function buildFriendSharePayload() {
  return {
    title: FRIEND_SHARE_TITLE
  };
}

function buildTimelineSharePayload() {
  return {
    title: TIMELINE_SHARE_TITLE
  };
}

function registerShareSupport(wxApi) {
  if (!wxApi) {
    return;
  }

  if (typeof wxApi.showShareMenu === "function") {
    wxApi.showShareMenu({
      withShareTicket: true,
      menus: ["shareAppMessage", "shareTimeline"]
    });
  }

  if (typeof wxApi.onShareAppMessage === "function") {
    wxApi.onShareAppMessage(function () {
      return buildFriendSharePayload();
    });
  }

  if (typeof wxApi.onShareTimeline === "function") {
    wxApi.onShareTimeline(function () {
      return buildTimelineSharePayload();
    });
  }
}

module.exports = {
  FRIEND_SHARE_TITLE,
  TIMELINE_SHARE_TITLE,
  buildFriendSharePayload,
  buildTimelineSharePayload,
  registerShareSupport
};
