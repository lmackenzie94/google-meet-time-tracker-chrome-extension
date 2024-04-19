// import { MEETING_STATUS } from '../types';
// import type { MeetingDetails } from '../types';

import { MEETING_STATUS, MeetingDetails } from '../types';

chrome.runtime.onInstalled.addListener(async function () {
  const allMeetings = await getMeetings();
  setBadgeText(allMeetings);
});

// Listen for a new meeting and add it to allMeetings
chrome.runtime.onMessage.addListener(async function (request) {
  // save meeting
  if (request.action === 'saveMeeting') {
    const allMeetings = await saveMeeting(request.meeting);
    setBadgeText(allMeetings);
  }

  // update title
  if (request.action === 'updateTitle') {
    const allMeetings = await getMeetings();

    // find the meeting to update
    const meetingToUpdate = allMeetings.find(m => m.id === request.meetingId);

    if (meetingToUpdate) {
      console.log(
        `Updating title for meeting: ${meetingToUpdate.id} to ${request.newTitle}`
      );
      const index = allMeetings.indexOf(meetingToUpdate);
      const updatedMeeting = { ...meetingToUpdate, title: request.newTitle };

      allMeetings[index] = updatedMeeting;

      setMeetings(allMeetings);
    }
  }
});

async function saveMeeting(
  newMeeting: MeetingDetails
): Promise<MeetingDetails[]> {
  const allMeetings = await getMeetings();

  // check if the meeting is already in the list
  const existingMeeting = allMeetings.find(m => m.id === newMeeting.id);

  if (existingMeeting) {
    const index = allMeetings.indexOf(existingMeeting);

    // update the existing meeting
    allMeetings[index] = newMeeting;

    // always use the title from the existing meeting
    allMeetings[index].title = existingMeeting.title;
  } else {
    // add the new meeting
    allMeetings.push(newMeeting);
  }

  setMeetings(allMeetings);

  return allMeetings;
}

function getMeetings(): Promise<MeetingDetails[]> {
  return new Promise(resolve => {
    chrome.storage.sync.get('allMeetings', function (data) {
      const allMeetings = data.allMeetings || [];

      resolve(allMeetings);
    });
  });
}

function setMeetings(allMeetings: MeetingDetails[]): void {
  chrome.storage.sync.set({ allMeetings: allMeetings });
}

function setBadgeText(allMeetings: MeetingDetails[]): void {
  const meetingIsInProgress = allMeetings.some(
    m => m.status === MEETING_STATUS.IN_PROGRESS
  );

  if (meetingIsInProgress) {
    chrome.action.setBadgeText({ text: '🔴' });
    return;
  }

  const completedMeetings = allMeetings.filter(
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
