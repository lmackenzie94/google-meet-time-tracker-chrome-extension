// import { MEETING_STATUS } from '../types';
// import type { MeetingDetails } from '../types';

import { MEETING_STATUS, MeetingDetails } from '../types';

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

  // update title
  if (request.action === 'updateTitle') {
    const recentMeetings = await getRecentMeetings();

    // find the meeting to update
    const meetingToUpdate = recentMeetings.find(
      m => m.id === request.meetingId
    );

    if (meetingToUpdate) {
      console.log(
        `Updating title for meeting: ${meetingToUpdate.id} to ${request.newTitle}`
      );
      const index = recentMeetings.indexOf(meetingToUpdate);
      const updatedMeeting = { ...meetingToUpdate, title: request.newTitle };

      recentMeetings[index] = updatedMeeting;

      setRecentMeetings(recentMeetings);
    }
  }
});

async function saveMeeting(
  newMeeting: MeetingDetails
): Promise<MeetingDetails[]> {
  const recentMeetings = await getRecentMeetings();

  // check if the meeting is already in the list
  const existingMeeting = recentMeetings.find(m => m.id === newMeeting.id);

  if (existingMeeting) {
    const index = recentMeetings.indexOf(existingMeeting);

    // update the existing meeting
    recentMeetings[index] = newMeeting;

    // always use the title from the existing meeting
    recentMeetings[index].title = existingMeeting.title;
  } else {
    // add the new meeting
    recentMeetings.push(newMeeting);
  }

  setRecentMeetings(recentMeetings);

  return recentMeetings;
}

function getRecentMeetings(): Promise<MeetingDetails[]> {
  return new Promise(resolve => {
    chrome.storage.sync.get('recentMeetings', function (data) {
      const recentMeetings = data.recentMeetings || [];

      resolve(recentMeetings);
    });
  });
}

function setRecentMeetings(recentMeetings: MeetingDetails[]): void {
  chrome.storage.sync.set({ recentMeetings: recentMeetings });
}

function setBadgeText(recentMeetings: MeetingDetails[]): void {
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
