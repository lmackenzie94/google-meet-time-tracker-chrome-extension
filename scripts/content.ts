import { MEETING_STATUS, MeetingDetails } from '../types';

//! If I defined these here and imported in other files, the entire contents of this file would be bundled into the other files (i.e. they'd all contain the Meeting class, Timer class, etc.).
// export enum MEETING_STATUS {
//   IN_PROGRESS = 'in-progress',
//   COMPLETED = 'completed'
// }

// export type MeetingDetails = {
//   id: string;
//   title: string;
//   date: string;
//   startTime: string;
//   endTime: string;
//   duration: number;
//   status: MEETING_STATUS;
// };

class Meeting {
  meetingDetails: MeetingDetails = {
    id: '',
    date: '',
    title: '',
    status: MEETING_STATUS.IN_PROGRESS,
    startTime: 0,
    startTimeFormatted: '',
    endTime: 0,
    endTimeFormatted: '',
    duration: 0
  };

  timer: Timer;

  constructor() {
    this.meetingDetails.id = this.getID();
    this.meetingDetails.date = this.getDate();

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
    const existingMeeting = await this.getExistingMeeting(
      this.meetingDetails.id
    );

    if (existingMeeting) {
      console.log('Existing meeting found: ', existingMeeting);
      this.meetingDetails = existingMeeting;
    } else {
      console.log('No existing meeting found. Starting new meeting...');
    }

    try {
      const joinButton = this.getJoinNowButton();
      joinButton?.addEventListener('click', this.start);
    } catch (error) {
      console.error('Error initializing meeting: ', error);
    }
  }

  // checks if user is re-joining the same meeting
  getExistingMeeting(id: string): Promise<MeetingDetails> {
    console.log('Checking for existing meeting with ID: ', id);
    return new Promise(resolve => {
      chrome.storage.sync.get('allMeetings', function (data) {
        const allMeetings = data.allMeetings || [];
        const meeting = allMeetings.find(
          (meeting: MeetingDetails) => meeting.id === id
        );

        resolve(meeting);
      });
    });
  }

  getDate() {
    const date = new Date();
    const options: any = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  getID(retries = 0): string {
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
      retries++;
      if (retries >= 5) {
        // TODO: do this properly
        return 'abc123';
      }

      console.log('Meeting ID not found. Retrying in 1 second');
      setTimeout(() => {
        this.getID(retries);
      }, 1000);

      return '';
    }
  }

  getJoinNowButton() {
    // find element with text content of "Join now"
    let joinNowSpan: any;

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

  getLeaveButton(): Promise<HTMLButtonElement> {
    const leaveButton = document.querySelector(
      'button[aria-label="Leave call"]'
    ) as HTMLButtonElement;

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

  getMeetingTitle(retries = 0): Promise<string> {
    if (this.meetingDetails.title) {
      console.log('Meeting title already exists: ', this.meetingDetails.title);
      return Promise.resolve(this.meetingDetails.title);
    }

    const meetingTitleDiv = document.querySelector('div[data-meeting-title]');

    return new Promise((resolve, reject) => {
      if (meetingTitleDiv) {
        const meetingTitle = meetingTitleDiv.getAttribute('data-meeting-title');
        if (meetingTitle) {
          console.log('Meeting title found: ', meetingTitle);
          resolve(meetingTitle);
        } else {
          console.error('Meeting title is null');
          reject('Meeting title is null');
        }
      } else {
        retries++;
        if (retries >= 5) {
          console.error('Meeting title element not found');
          reject('Meeting title element not found');
        }

        console.log('Meeting title element not found. Retrying in 1 second');
        setTimeout(() => {
          this.getMeetingTitle(retries).then(resolve);
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
    if (!this.meetingDetails.startTime) {
      this.meetingDetails.startTime = this.timer.startTime;
      this.meetingDetails.startTimeFormatted = this.timer.startTimeFormatted;
    }

    this.meetingDetails.status = MEETING_STATUS.IN_PROGRESS;
    this.meetingDetails.title = await this.getMeetingTitle();
    this.save();
    this.waitForMeetingEnd();
  }

  async end() {
    this.timer.stop();

    this.meetingDetails.endTime = this.timer.endTime;
    this.meetingDetails.endTimeFormatted = this.timer.endTimeFormatted;

    const duration = this.timer.getDurationInSeconds();

    // if re-joining the same meeting, add the new duration to the existing duration
    if (!this.meetingDetails.duration) {
      this.meetingDetails.duration = duration;
    } else {
      this.meetingDetails.duration += duration;
    }

    this.meetingDetails.status = MEETING_STATUS.COMPLETED;
    this.save();
  }

  save() {
    console.log('Saving meeting: ', this.meetingDetails);

    chrome.runtime.sendMessage({
      action: 'saveMeeting',
      meeting: this.meetingDetails
    });
  }
}

class Timer {
  startTime: number = 0;
  startTimeFormatted: string = '';
  endTime: number = 0;
  endTimeFormatted: string = '';

  start(): void {
    this.startTime = new Date().getTime();
    this.startTimeFormatted = this.formatTime(this.startTime);
  }

  stop(): void {
    this.endTime = new Date().getTime();
    this.endTimeFormatted = this.formatTime(this.endTime);
  }

  getDuration(): number {
    return this.endTime - this.startTime;
  }

  getDurationInSeconds(): number {
    return parseInt((this.getDuration() / 1000).toFixed(0));
  }

  formatTime(time: number): string {
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
function isValidMeetURL(url: string): boolean {
  const regex = /meet.google.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/;
  return regex.test(url);
}
