//! ideally move this to a constants file but couldn't figure out how to get import/export working
const MEETING_STATUS = {
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed'
};

class Meeting {
  meetingInfo = {
    id: null,
    date: null,
    title: null,
    status: null,
    startTime: null,
    endTime: null,
    duration: null
  };

  constructor() {
    this.meetingInfo.id = this.getID();
    this.meetingInfo.date = this.getDate();

    this.timer = new Timer();

    // bind
    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
    this.handleLeaveButton = this.handleLeaveButton.bind(this);

    // initialize
    this.init();
  }

  async init() {
    console.log('Meeting initialized');

    // check if the meeting already exists
    const existingMeeting = await this.getExistingMeeting(this.meetingInfo.id);

    if (existingMeeting) {
      console.log('Existing meeting found: ', existingMeeting);
      this.meetingInfo = existingMeeting;
    } else {
      console.log('No existing meeting found. Starting new meeting...');
    }

    try {
      const joinButton = this.getJoinNowButton();
      joinButton.addEventListener('click', this.start);
    } catch (error) {
      console.error('Error initializing meeting: ', error);
    }
  }

  // checks if user is re-joining the same meeting
  getExistingMeeting(id) {
    console.log('Checking for existing meeting with ID: ', id);
    return this.getMeeting(id);
  }

  getMeeting(id) {
    return new Promise(resolve => {
      chrome.storage.sync.get('recentMeetings', function (data) {
        const recentMeetings = data.recentMeetings || [];
        const meeting = recentMeetings.find(m => m.id === id);

        resolve(meeting);
      });
    });
  }

  getDate() {
    const date = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    console.log('Date: ', date.toLocaleDateString('en-US', options));
    return date.toLocaleDateString('en-US', options);
  }

  getID() {
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
      setTimeout(this.getID, 1000);
    }
  }

  getJoinNowButton() {
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
        console.log('Join Now button found');
        return joinButton;
      }
    } else {
      throw new Error('Join now button not found');
    }
  }

  getLeaveButton() {
    const leaveButton = document.querySelector(
      'button[aria-label="Leave call"]'
    );

    if (leaveButton) {
      return Promise.resolve(leaveButton);
    } else {
      console.log('Leave button not found. Retrying in 1 second');
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          this.getLeaveButton().then(resolve);
        }, 1000);
      });
    }
  }

  getMeetingTitle() {
    if (this.meetingInfo.title) {
      console.log('Meeting title already exists: ', this.meetingInfo.title);
      return Promise.resolve(this.meetingInfo.title);
    }

    const meetingTitleDiv = document.querySelector('div[data-meeting-title]');

    return new Promise((resolve, reject) => {
      if (meetingTitleDiv) {
        const meetingTitle = meetingTitleDiv.getAttribute('data-meeting-title');
        console.log('Meeting title found: ', meetingTitle);
        resolve(meetingTitle);
      } else {
        console.log('Meeting title not found. Retrying in 1 second');
        setTimeout(() => {
          this.getMeetingTitle().then(resolve);
        }, 1000);
      }
    });
  }

  async waitForMeetingEnd() {
    const leaveButton = await this.getLeaveButton();
    leaveButton.addEventListener('click', this.handleLeaveButton);

    // Also stop the timer when the user closes the tab
    window.addEventListener('beforeunload', this.end);
  }

  handleLeaveButton() {
    // Remove tab close event listener (otherwise timer continues running after the meeting ends)
    window.removeEventListener('beforeunload', this.end);
    this.end();
  }

  async start() {
    this.timer.start();

    // if the meeting is re-joined, use the initial start time
    if (!this.meetingInfo.startTime) {
      this.meetingInfo.startTime = this.timer.startTimeFormatted;
    }

    this.meetingInfo.status = MEETING_STATUS.IN_PROGRESS;
    this.meetingInfo.title = await this.getMeetingTitle();
    this.save();
    this.waitForMeetingEnd();
  }

  async end() {
    this.timer.stop();
    this.meetingInfo.endTime = this.timer.endTimeFormatted;

    const duration = this.timer.getDurationInSeconds();

    // if re-joining the same meeting, add the new duration to the existing duration
    if (!this.meetingInfo.duration) {
      this.meetingInfo.duration = duration;
    } else {
      this.meetingInfo.duration += duration;
    }

    // check if user changed the meeting title
    const savedMeetingInfo = await this.getMeeting(this.meetingInfo.id);

    if (savedMeetingInfo && savedMeetingInfo.title !== this.meetingInfo.title) {
      console.log(
        'Title changed: ',
        savedMeetingInfo.title,
        this.meetingInfo.title
      );
      this.meetingInfo.title = savedMeetingInfo.title;
    }

    this.meetingInfo.status = MEETING_STATUS.COMPLETED;
    this.save();
  }

  save() {
    console.log('Saving meeting: ', this.meetingInfo);

    chrome.runtime.sendMessage({
      action: 'saveMeeting',
      meeting: this.meetingInfo
    });
  }
}

class Timer {
  startTime = null;
  startTimeFormatted = null;
  endTime = null;
  endTimeFormatted = null;

  start() {
    this.startTime = new Date().getTime();
    this.startTimeFormatted = this.formatTime(this.startTime);
  }

  stop() {
    this.endTime = new Date().getTime();
    this.endTimeFormatted = this.formatTime(this.endTime);
  }

  getDuration() {
    return this.endTime - this.startTime;
  }

  getDurationInSeconds() {
    return parseInt((this.getDuration() / 1000).toFixed(0));
  }

  formatTime(time) {
    // ex: 10:30 AM
    const date = new Date(time);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  }
}

// Detect when the user joins or leaves a Google Meet call
window.addEventListener('load', () => {
  console.log('⏰ Google Meet Time Tracker extension loaded!');

  if (isValidMeetURL(window.location.href)) {
    console.log('Google Meet URL detected');
    new Meeting();
  } else {
    console.log('Not a Google Meet URL');
    return;
  }
});

// validate URL (must contain meeting code (ex. xxx-xxxx-xxx)
function isValidMeetURL(url) {
  const regex = /meet.google.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/;
  return regex.test(url);
}
