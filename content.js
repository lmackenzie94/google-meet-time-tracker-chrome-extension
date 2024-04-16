// let inMeeting = false;
const meetingDate = getDate();
let startTime = null;
let meetingTitle = null;

function startTimer() {
  console.log('Meeting started');
  // inMeeting = true;
  startTime = new Date().getTime();
}

function stopTimer() {
  let meetingInfo = {
    title: meetingTitle,
    date: meetingDate
  };

  // inMeeting = false;
  const endTime = new Date().getTime();
  const durationInSeconds = ((endTime - startTime) / 1000).toFixed(0);

  if (durationInSeconds > 60) {
    const durationInMinutes = (durationInSeconds / 60).toFixed(2);
    console.log(
      `Meeting "${meetingTitle}" duration: ${durationInMinutes} minutes`
    );
    meetingInfo.duration = `${durationInMinutes} minutes`;
  } else {
    console.log(
      `Meeting "${meetingTitle}" duration: ${durationInSeconds} seconds`
    );
    meetingInfo.duration = `${durationInSeconds} seconds`;
  }

  saveMeeting(meetingInfo);
}

// Detect when the user joins or leaves a Google Meet call
window.addEventListener('load', () => {
  console.log('Google Meet extension loaded');

  // find element with text content of "Join now"
  let joinNowSpan = null;

  document.querySelectorAll('span').forEach(span => {
    if (span.textContent === 'Join now') {
      joinNowSpan = span;
    }
  });

  if (joinNowSpan) {
    console.log('Join now span found', joinNowSpan);

    // find the closest button element to the span
    const joinButton = joinNowSpan.closest('button');

    if (joinButton) {
      console.log('Join button found', joinButton);

      // Add a click event listener to the join button
      joinButton.addEventListener('click', () => {
        console.log('Join button clicked');
        startTimer();
        getMeetingTitle();
        waitForMeetingEnd();
      });
    }
  }
});

function getMeetingTitle() {
  // div with data-meeting-title attribute
  const meetingTitleDiv = document.querySelector('div[data-meeting-title]');
  if (meetingTitleDiv) {
    meetingTitle = meetingTitleDiv.getAttribute('data-meeting-title');
    console.log('Meeting title:', meetingTitle);
  } else {
    console.log('Meeting title not found. Retrying in 1 second');
    setTimeout(getMeetingTitle, 1000);
  }
}

function waitForMeetingEnd() {
  const leaveButton = document.querySelector('button[aria-label="Leave call"]');

  if (leaveButton) {
    console.log('Leave button found', leaveButton);

    // Add a click event listener to the leave button
    leaveButton.addEventListener('click', () => {
      console.log('Leave button clicked');
      stopTimer();
    });

    // Also stop the timer when the user closes the tab
    window.addEventListener('beforeunload', () => {
      console.log('Tab is closing');
      stopTimer();
    });
  } else {
    console.log('Leave button not found, waiting for 1 second');
    setTimeout(waitForMeetingEnd, 1000);
  }
}

function saveMeeting(meetingInfo) {
  // Send a message to the background script to store the meeting
  chrome.runtime.sendMessage({
    action: 'saveMeeting',
    meeting: meetingInfo
  });
}

function getDate() {
  // example: Thursday, April 1
  const date = new Date().toDateString();
  const dateParts = date.split(' ');
  return `${dateParts[0]}, ${dateParts[1]} ${dateParts[2]}`;
}
