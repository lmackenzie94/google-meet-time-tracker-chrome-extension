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
            const recentMeetings = yield getRecentMeetings();
            setBadgeText(recentMeetings);
        });
    });
    // Listen for a new meeting and add it to recentMeetings
    chrome.runtime.onMessage.addListener(function (request) {
        return __awaiter(this, void 0, void 0, function* () {
            // save meeting
            if (request.action === 'saveMeeting') {
                const recentMeetings = yield saveMeeting(request.meeting);
                setBadgeText(recentMeetings);
            }
            // update title
            if (request.action === 'updateTitle') {
                const recentMeetings = yield getRecentMeetings();
                // find the meeting to update
                const meetingToUpdate = recentMeetings.find(m => m.id === request.meetingId);
                if (meetingToUpdate) {
                    console.log(`Updating title for meeting: ${meetingToUpdate.id} to ${request.newTitle}`);
                    const index = recentMeetings.indexOf(meetingToUpdate);
                    const updatedMeeting = Object.assign(Object.assign({}, meetingToUpdate), { title: request.newTitle });
                    recentMeetings[index] = updatedMeeting;
                    setRecentMeetings(recentMeetings);
                }
            }
        });
    });
    function saveMeeting(newMeeting) {
        return __awaiter(this, void 0, void 0, function* () {
            const recentMeetings = yield getRecentMeetings();
            // check if the meeting is already in the list
            const existingMeeting = recentMeetings.find(m => m.id === newMeeting.id);
            if (existingMeeting) {
                const index = recentMeetings.indexOf(existingMeeting);
                // update the existing meeting
                recentMeetings[index] = newMeeting;
                // always use the title from the existing meeting
                recentMeetings[index].title = existingMeeting.title;
            }
            else {
                // add the new meeting
                recentMeetings.push(newMeeting);
            }
            setRecentMeetings(recentMeetings);
            return recentMeetings;
        });
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
    function setBadgeText(recentMeetings) {
        const meetingIsInProgress = recentMeetings.some(m => m.status === MEETING_STATUS.IN_PROGRESS);
        if (meetingIsInProgress) {
            chrome.action.setBadgeText({ text: '🔴' });
            return;
        }
        const completedMeetings = recentMeetings.filter(m => m.status === MEETING_STATUS.COMPLETED);
        if (completedMeetings.length) {
            chrome.action.setBadgeText({
                text: completedMeetings.length.toString()
            });
        }
        else {
            // remove the badge if there are no completed meetings
            chrome.action.setBadgeText({ text: '' });
        }
    }

})();
