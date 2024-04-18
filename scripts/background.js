//! ideally move this to a constants file but couldn't figure out how to get import/export working
const MEETING_STATUS = {
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed'
};

chrome.runtime.onInstalled.addListener(async function () {
  const recentMeetings = await getRecentMeetings();
  setBadgeText(recentMeetings);
});

// Listen for a new meeting and add it to recentMeetings
chrome.runtime.onMessage.addListener(async function (request) {
  // save meeting
  if (request.action === 'saveMeeting') {
    const recentMeetings = await saveMeeting(request.meeting);
    setBadgeText(recentMeetings);
  }
});

async function saveMeeting(newMeeting) {
  const recentMeetings = await getRecentMeetings();

  // check if the meeting is already in the list
  const existingMeeting = recentMeetings.find(m => m.id === newMeeting.id);

  if (existingMeeting) {
    const index = recentMeetings.indexOf(existingMeeting);

    // update the existing meeting
    recentMeetings[index] = newMeeting;
  } else {
    // add the new meeting
    recentMeetings.push(newMeeting);
  }

  setRecentMeetings(recentMeetings);

  return recentMeetings;
}

function getRecentMeetings() {
  return new Promise(resolve => {
    chrome.storage.sync.get('recentMeetings', function (data) {
      const recentMeetings = data.recentMeetings || [];

      resolve(recentMeetings);
    });
  });
}

function setRecentMeetings(recentMeetings) {
  chrome.storage.sync.set({ recentMeetings: recentMeetings });
}

function setBadgeText(recentMeetings) {
  const meetingIsInProgress = recentMeetings.some(
    m => m.status === MEETING_STATUS.IN_PROGRESS
  );

  if (meetingIsInProgress) {
    chrome.action.setBadgeText({ text: '🔴' });
    return;
  }

  const completedMeetings = recentMeetings.filter(
    m => m.status === MEETING_STATUS.COMPLETED
  );

  if (completedMeetings.length) {
    chrome.action.setBadgeText({
      text: completedMeetings.length.toString()
    });
  } else {
    // remove the badge if there are no completed meetings
    chrome.action.setBadgeText({ text: '' });
  }
}
