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

    // import { MEETING_STATUS } from '../types';
    chrome.runtime.onInstalled.addListener(function () {
        return __awaiter(this, void 0, void 0, function* () {
            const allMeetings = yield getMeetings();
            setBadgeText(allMeetings);
        });
    });
    // Listen for a new meeting and add it to allMeetings
    chrome.runtime.onMessage.addListener(function (request) {
        return __awaiter(this, void 0, void 0, function* () {
            // save meeting
            if (request.action === 'saveMeeting') {
                const allMeetings = yield saveMeeting(request.meeting);
                setBadgeText(allMeetings);
            }
            // update title
            if (request.action === 'updateTitle') {
                const allMeetings = yield getMeetings();
                // find the meeting to update
                const meetingToUpdate = allMeetings.find(m => m.id === request.meetingId);
                if (meetingToUpdate) {
                    console.log(`Updating title for meeting: ${meetingToUpdate.id} to ${request.newTitle}`);
                    const index = allMeetings.indexOf(meetingToUpdate);
                    const updatedMeeting = Object.assign(Object.assign({}, meetingToUpdate), { title: request.newTitle });
                    allMeetings[index] = updatedMeeting;
                    setMeetings(allMeetings);
                }
            }
        });
    });
    function saveMeeting(newMeeting) {
        return __awaiter(this, void 0, void 0, function* () {
            const allMeetings = yield getMeetings();
            // check if the meeting is already in the list
            const existingMeeting = allMeetings.find(m => m.id === newMeeting.id);
            if (existingMeeting) {
                const index = allMeetings.indexOf(existingMeeting);
                // update the existing meeting
                allMeetings[index] = newMeeting;
                // always use the title from the existing meeting
                allMeetings[index].title = existingMeeting.title;
            }
            else {
                // add the new meeting
                allMeetings.push(newMeeting);
            }
            setMeetings(allMeetings);
            return allMeetings;
        });
    }
    function getMeetings() {
        return new Promise(resolve => {
            chrome.storage.sync.get('allMeetings', function (data) {
                const allMeetings = data.allMeetings || [];
                resolve(allMeetings);
            });
        });
    }
    function setMeetings(allMeetings) {
        chrome.storage.sync.set({ allMeetings: allMeetings });
    }
    function setBadgeText(allMeetings) {
        const meetingsInProgress = allMeetings.filter(m => m.status === MEETING_STATUS.IN_PROGRESS);
        if (meetingsInProgress.length) {
            chrome.action.setBadgeText({ text: meetingsInProgress.length.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#f14668' });
            return;
        }
        const completedMeetings = allMeetings.filter(m => m.status === MEETING_STATUS.COMPLETED);
        if (completedMeetings.length) {
            chrome.action.setBadgeText({
                text: completedMeetings.length.toString()
            });
            chrome.action.setBadgeBackgroundColor({ color: '#48c78e' });
        }
        else {
            // remove the badge if there are no completed meetings
            chrome.action.setBadgeText({ text: '' });
        }
    }

})();
