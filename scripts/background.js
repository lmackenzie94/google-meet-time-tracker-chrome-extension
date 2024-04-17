chrome.runtime.onInstalled.addListener(async function () {
  const recentMeetings = await getRecentMeetings();
  setBadgeText(recentMeetings);
});

// Listen for a new meeting and add it to recentMeetings
chrome.runtime.onMessage.addListener(async function (request) {
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
    // find the index of the existing meeting
    const index = recentMeetings.indexOf(existingMeeting);
    const updatedMeeting = updateMeeting(existingMeeting, newMeeting);
    recentMeetings[index] = updatedMeeting;
  } else {
    // add the meeting
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

function getCumulativeDuration(existingMeeting, newMeeting) {
  const currentCumulativeDuration = existingMeeting.cumulativeDuration || 0;
  const newDuration = newMeeting.duration;

  return currentCumulativeDuration + newDuration;
}

function setBadgeText(recentMeetings) {
  const completedMeetings = recentMeetings.filter(
    m => m.status === 'completed'
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

function updateMeeting(existingMeeting, newMeeting) {
  // this handles changing the status from in-progress to completed
  // and cases where users leave and rejoin a meeting

  console.log('Meeting already saved', existingMeeting);

  // update the cumulative duration if the meeting is completed
  if (newMeeting.status === 'completed') {
    newMeeting.cumulativeDuration = getCumulativeDuration(
      existingMeeting,
      newMeeting
    );
  }

  // track re-join times
  if (newMeeting.status === 'in-progress') {
    newMeeting.rejoinTimes = [
      ...(existingMeeting.rejoinTimes || []),
      newMeeting.startTime
    ];
  }

  const updatedMeeting = {
    ...existingMeeting,
    ...newMeeting,
    startTime: existingMeeting.startTime // keep the original start time
  };

  console.log('Meeting updated', updatedMeeting);

  return updatedMeeting;
}
