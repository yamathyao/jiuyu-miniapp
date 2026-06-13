function buildFriendSharePayload(t) {
  return {
    title: t("share.friendTitle")
  };
}

function buildTimelineSharePayload(t) {
  return {
    title: t("share.timelineTitle")
  };
}

function registerShareSupport(wxApi, t) {
  if (!wxApi) {
    return;
  }

  const translator = typeof t === "function"
    ? t
    : function (key) {
        return key;
      };

  if (typeof wxApi.showShareMenu === "function") {
    wxApi.showShareMenu({
      withShareTicket: true,
      menus: ["shareAppMessage", "shareTimeline"]
    });
  }

  if (typeof wxApi.onShareAppMessage === "function") {
    wxApi.onShareAppMessage(function () {
      return buildFriendSharePayload(translator);
    });
  }

  if (typeof wxApi.onShareTimeline === "function") {
    wxApi.onShareTimeline(function () {
      return buildTimelineSharePayload(translator);
    });
  }
}

module.exports = {
  buildFriendSharePayload,
  buildTimelineSharePayload,
  registerShareSupport
};
