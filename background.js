// Listen for a new meeting and add it to recentMeetings
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'saveMeeting') {
    chrome.storage.sync.get('recentMeetings', function (data) {
      const recentMeetings = data.recentMeetings || [];
      recentMeetings.push(request.meeting);
      chrome.storage.sync.set({ recentMeetings });
      chrome.action.setBadgeText({ text: recentMeetings.length.toString() });

      // TODO: handle re-join meeting
    });
  }
});
