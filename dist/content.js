(function () {
    'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    //! changing this to a .d.ts file caused rollup build to fail
    var MEETING_STATUS;
    (function (MEETING_STATUS) {
        MEETING_STATUS["IN_PROGRESS"] = "in-progress";
        MEETING_STATUS["COMPLETED"] = "completed";
    })(MEETING_STATUS || (MEETING_STATUS = {}));

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
        constructor() {
            this.meetingDetails = {
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
        init() {
            return __awaiter(this, void 0, void 0, function* () {
                console.log('Meeting initialized');
                // check if the meeting already exists
                const existingMeeting = yield this.getExistingMeeting(this.meetingDetails.id);
                if (existingMeeting) {
                    console.log('Existing meeting found: ', existingMeeting);
                    this.meetingDetails = existingMeeting;
                }
                else {
                    console.log('No existing meeting found. Starting new meeting...');
                }
                try {
                    const joinButton = this.getJoinNowButton();
                    joinButton === null || joinButton === void 0 ? void 0 : joinButton.addEventListener('click', this.start);
                }
                catch (error) {
                    console.error('Error initializing meeting: ', error);
                }
            });
        }
        // checks if user is re-joining the same meeting
        getExistingMeeting(id) {
            console.log('Checking for existing meeting with ID: ', id);
            return new Promise(resolve => {
                chrome.storage.sync.get('allMeetings', function (data) {
                    const allMeetings = data.allMeetings || [];
                    const meeting = allMeetings.find((meeting) => meeting.id === id);
                    resolve(meeting);
                });
            });
        }
        getDate() {
            const date = new Date();
            const options = { weekday: 'long', month: 'long', day: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        }
        getID(retries = 0) {
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
            }
            else {
                retries++;
                if (retries >= 10) {
                    // just return a random ID
                    console.error('Meeting ID not found. Generating random ID');
                    return Math.random().toString(36).substring(2, 15); //
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
            let joinNowSpan;
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
            }
            else {
                throw new Error('Join now button not found');
            }
        }
        getLeaveButton() {
            const leaveButton = document.querySelector('button[aria-label="Leave call"]');
            if (leaveButton) {
                return Promise.resolve(leaveButton);
            }
            else {
                console.log('Leave button not found. Retrying in 1 second');
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        this.getLeaveButton().then(resolve);
                    }, 1000);
                });
            }
        }
        getMeetingTitle(retries = 0) {
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
                    }
                    else {
                        console.error('Meeting title is null. Setting to "Untitled"');
                        resolve('Untitled');
                    }
                }
                else {
                    retries++;
                    if (retries >= 10) {
                        console.error('Meeting title element not found. Setting to "Untitled"');
                        resolve('Untitled');
                    }
                    console.log('Meeting title element not found. Retrying in 1 second');
                    setTimeout(() => {
                        this.getMeetingTitle(retries).then(resolve);
                    }, 1000);
                }
            });
        }
        waitForMeetingEnd() {
            return __awaiter(this, void 0, void 0, function* () {
                const leaveButton = yield this.getLeaveButton();
                leaveButton.addEventListener('click', this.handleLeaveButton);
                // Also stop the timer when the user closes the tab
                window.addEventListener('beforeunload', this.end);
            });
        }
        handleLeaveButton() {
            // Remove tab close event listener (otherwise timer continues running after the meeting ends)
            window.removeEventListener('beforeunload', this.end);
            this.end();
        }
        start() {
            return __awaiter(this, void 0, void 0, function* () {
                this.timer.start();
                // if the meeting is re-joined, use the initial start time
                if (!this.meetingDetails.startTime) {
                    this.meetingDetails.startTime = this.timer.startTime;
                    this.meetingDetails.startTimeFormatted = this.timer.startTimeFormatted;
                }
                this.meetingDetails.status = MEETING_STATUS.IN_PROGRESS;
                this.meetingDetails.title = yield this.getMeetingTitle();
                this.save();
                this.waitForMeetingEnd();
            });
        }
        end() {
            return __awaiter(this, void 0, void 0, function* () {
                this.timer.stop();
                this.meetingDetails.endTime = this.timer.endTime;
                this.meetingDetails.endTimeFormatted = this.timer.endTimeFormatted;
                const duration = this.timer.getDurationInSeconds();
                // if re-joining the same meeting, add the new duration to the existing duration
                if (!this.meetingDetails.duration) {
                    this.meetingDetails.duration = duration;
                }
                else {
                    this.meetingDetails.duration += duration;
                }
                this.meetingDetails.status = MEETING_STATUS.COMPLETED;
                this.save();
            });
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
        constructor() {
            this.startTime = 0;
            this.startTimeFormatted = '';
            this.endTime = 0;
            this.endTimeFormatted = '';
        }
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
        }
        else {
            console.log('Not a Google Meet URL');
            return;
        }
    });
    // validate URL (must contain meeting code (ex. xxx-xxxx-xxx)
    function isValidMeetURL(url) {
        const regex = /meet.google.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/;
        return regex.test(url);
    }

})();
