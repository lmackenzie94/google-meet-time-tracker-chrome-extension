// Listen for a new meeting and add it to recentMeetings
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'saveMeeting') {
    const meeting = request.meeting;

    chrome.storage.sync.get('recentMeetings', function (data) {
      const recentMeetings = data.recentMeetings || [];

      // check if the meeting is already in the list
      const existingMeeting = recentMeetings.find(m => m.id === meeting.id);

      if (existingMeeting) {
        // update the meeting
        // this handles changing the status from in-progress to completed
        // and cases where users leave and rejoin a meeting

        console.log('Meeting already saved', existingMeeting);

        const index = recentMeetings.indexOf(existingMeeting);

        // update the cumulative duration if the meeting is completed
        if (meeting.status === 'completed') {
          meeting.cumulativeDuration = getCumulativeDuration(
            existingMeeting,
            meeting
          );
        }

        // track re-join times
        if (meeting.status === 'in-progress') {
          meeting.rejoinTimes = [
            ...(existingMeeting.rejoinTimes || []),
            meeting.startTime
          ];
        }

        const updatedMeeting = {
          ...existingMeeting,
          ...meeting,
          startTime: existingMeeting.startTime // keep the original start time
        };

        console.log('Meeting updated', updatedMeeting);

        recentMeetings[index] = updatedMeeting;
      } else {
        // add the meeting
        recentMeetings.push(meeting);
      }

      chrome.storage.sync.set({ recentMeetings: recentMeetings });
    });
  }
});

function getCumulativeDuration(existingMeeting, newMeeting) {
  const currentCumulativeDuration = existingMeeting.cumulativeDuration || 0;
  const newDuration = newMeeting.duration;

  return currentCumulativeDuration + newDuration;
}
