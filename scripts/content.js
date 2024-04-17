// TODO: what happens if you open another tab with a Google Meet call while one is already in progress?

const meetingDate = getDate();
const meetingID = getMeetingID();
let startTime = null;
let meetingTitle = null;

function startTimer() {
  console.log('Meeting started');
  startTime = new Date().getTime();
}

function stopTimer() {
  saveMeeting({
    id: meetingID,
    title: meetingTitle,
    date: meetingDate,
    duration: getMeetingDurationInSeconds(startTime),
    status: 'completed'
  });
}

// Detect when the user joins or leaves a Google Meet call
window.addEventListener('load', () => {
  console.log('⏰ Google Meet Time Tracker extension loaded!');

  const joinButton = getJoinNowButton();

  joinButton.addEventListener('click', () => {
    startTimer();
    getMeetingTitle().then(title => {
      console.log('Meeting title: ', title);

      meetingTitle = title;

      saveMeeting({
        id: meetingID,
        title: meetingTitle,
        date: meetingDate,
        startTime: formatTime(startTime),
        status: 'in-progress'
      });
    });

    waitForMeetingEnd();
  });
});

async function getMeetingTitle() {
  // div with data-meeting-title attribute
  const meetingTitleDiv = document.querySelector('div[data-meeting-title]');

  return new Promise((resolve, reject) => {
    if (meetingTitleDiv) {
      const meetingTitle = meetingTitleDiv.getAttribute('data-meeting-title');
      resolve(meetingTitle);
    } else {
      console.log('Meeting title not found. Retrying in 1 second');
      setTimeout(() => {
        getMeetingTitle().then(resolve);
      }, 1000);
    }
  });
}

function getMeetingID() {
  // div with data-meeting-code attribute
  const meetingIDDiv = document.querySelector('div[data-meeting-code]');

  // have to add date-stamp to meeting ID to make it unique (since the same meeting ID can be reused)

  if (meetingIDDiv) {
    const meetingID = meetingIDDiv.getAttribute('data-meeting-code');

    // dateStamp - ex. 04172024
    const dateStamp = new Date().toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });

    const uniqueMeetingID = `${meetingID}-${dateStamp}`;
    console.log('Unique Meeting ID: ', uniqueMeetingID);

    return uniqueMeetingID;
  } else {
    console.log('Meeting ID not found. Retrying in 1 second');
    setTimeout(getMeetingID, 1000);
  }
}

function getMeetingDurationInSeconds(startTime) {
  const endTime = new Date().getTime();
  const durationInSeconds = ((endTime - startTime) / 1000).toFixed(0);

  // convert to number
  return parseInt(durationInSeconds);
}

function waitForMeetingEnd() {
  const leaveButton = document.querySelector('button[aria-label="Leave call"]');

  if (leaveButton) {
    console.log('Leave button found', leaveButton);

    // Add a click event listener to the leave button
    leaveButton.addEventListener('click', handleLeaveButton);

    // Also stop the timer when the user closes the tab
    window.addEventListener('beforeunload', stopTimer);
  } else {
    console.log('Leave button not found, waiting for 1 second');
    setTimeout(waitForMeetingEnd, 1000);
  }
}

function handleLeaveButton() {
  console.log('Leave button clicked');
  stopTimer();

  // Remove tab close event listener (otherwise timer continues running after the meeting ends)
  window.removeEventListener('beforeunload', stopTimer);
}

function saveMeeting(meetingInfo) {
  // Send a message to the background script to store the meeting
  chrome.runtime.sendMessage({
    action: 'saveMeeting',
    meeting: meetingInfo
  });
}

function getDate() {
  const date = new Date();
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  console.log('Date: ', date.toLocaleDateString('en-US', options));
  return date.toLocaleDateString('en-US', options);
}

function getJoinNowButton() {
  // find element with text content of "Join now"
  let joinNowSpan = null;
  document.querySelectorAll('span').forEach(span => {
    if (span.textContent === 'Join now') {
      joinNowSpan = span;
    }
  });

  if (joinNowSpan) {
    // find the closest button element to the span
    const joinButton = joinNowSpan.closest('button');

    if (joinButton) {
      console.log('Join Now button found', joinButton);
      return joinButton;
    }
  } else {
    throw new Error('Join now button not found');
  }
}

function formatTime(time) {
  // ex: 10:30 AM
  const date = new Date(time);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}
