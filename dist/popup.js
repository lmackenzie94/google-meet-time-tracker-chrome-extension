(function () {
  'use strict';

  //! changing this to a .d.ts file caused rollup build to fail
  var MEETING_STATUS;
  (function (MEETING_STATUS) {
      MEETING_STATUS["IN_PROGRESS"] = "in-progress";
      MEETING_STATUS["COMPLETED"] = "completed";
  })(MEETING_STATUS || (MEETING_STATUS = {}));

  document.addEventListener('DOMContentLoaded', function () {
      refreshMeetings();
      initClearButton();
  });
  function initClearButton() {
      const clearButton = document.getElementById('clearCompletedMeetings');
      clearButton === null || clearButton === void 0 ? void 0 : clearButton.addEventListener('click', clearCompletedMeetings);
  }
  function displayMeetingsInProgress(meetings) {
      // clear the list
      const meetingsInProgressList = document.getElementById('meetingsInProgress');
      if (!meetingsInProgressList) {
          console.error('Meetings in progress list not found');
          return;
      }
      meetingsInProgressList.innerHTML = '';
      // filter the meetings that are in progress
      const meetingsInProgress = meetings.filter(meeting => meeting.status === MEETING_STATUS.IN_PROGRESS);
      if (meetingsInProgress.length === 0)
          return;
      const container = document.createElement('div');
      const ul = document.createElement('ul');
      meetingsInProgress.forEach(meeting => {
          const li = createMeetingInProgressElement(meeting);
          ul.appendChild(li);
      });
      container.appendChild(ul);
      meetingsInProgressList.appendChild(container);
  }
  function createMeetingInProgressElement(meeting) {
      const li = document.createElement('li');
      li.innerHTML = `
    <div class="is-flex is-justify-content-space-between is-align-items-center has-background-danger-light px-4 py-2 is-size-7">
      <div class="">
        <p id="meeting-title" data-meeting-id="${meeting.id}" class="has-text-weight-bold">${meeting.title}</p>
        <p class="is-size-8">Joined at ${meeting.startTime}</p>
      </div>
      <span class="tag is-danger is-text-white ml-2 is-uppercase tag-small has-text-weight-semibold animate-pulse">In Progress</span>
    </div>
   
    `;
      return li;
  }
  function displayCompletedMeetings(meetings) {
      // clear the list
      const completedMeetingsList = document.getElementById('completedMeetings');
      if (!completedMeetingsList) {
          console.error('Completed meetings list not found');
          return;
      }
      completedMeetingsList.innerHTML = '';
      // filter the meetings that are completed
      const meetingsCompleted = meetings.filter(meeting => meeting.status === MEETING_STATUS.COMPLETED);
      if (meetingsCompleted.length === 0) {
          const noCompletedMeetingsElement = createNoCompletedMeetingsElement();
          completedMeetingsList.appendChild(noCompletedMeetingsElement);
          return;
      }
      const meetingsByDate = groupMeetingsByDate(meetingsCompleted);
      let index = 0;
      for (const date in meetingsByDate) {
          const dateHeader = createDateHeader(date, index);
          index++;
          completedMeetingsList.appendChild(dateHeader);
          // Meetings
          const meetings = meetingsByDate[date];
          const container = document.createElement('div');
          const ul = document.createElement('ul');
          meetings.forEach(meeting => {
              const li = createMeetingCompletedElement(meeting);
              ul.appendChild(li);
          });
          container.appendChild(ul);
          completedMeetingsList.appendChild(container);
      }
  }
  function createNoCompletedMeetingsElement() {
      const container = document.createElement('div');
      container.classList.add('has-background-light', 'p-2');
      const p = document.createElement('p');
      p.textContent = 'No meeting history found.';
      p.classList.add('is-size-7', 'has-text-grey');
      container.appendChild(p);
      return container;
  }
  function createDateHeader(date, index) {
      const dateHeader = document.createElement('p');
      dateHeader.textContent = date;
      dateHeader.classList.add('has-text-weight-bold', 'mb-1', 'is-size-7', 'has-text-link', index === 0 ? 'mt-0' : 'mt-4');
      return dateHeader;
  }
  function createMeetingCompletedElement(meeting) {
      const li = document.createElement('li');
      const formattedDuration = formatMeetingDuration(meeting.duration);
      const meetingTime = meeting.startTime !== meeting.endTime
          ? `${meeting.startTime} - ${meeting.endTime}`
          : meeting.startTime;
      li.innerHTML = `
      <div class="is-flex is-justify-content-space-between is-align-items-center has-background-light px-2 py-1 mb-1 is-size-7" style="border-radius: 4px;">
        <div>
          <p id="meeting-title" data-meeting-id="${meeting.id}"><strong>${meeting.title}</strong></p>
          <p class="is-size-8 has-text-grey">
            ${meetingTime}
          </p>
        </div>
        <span class="tag is-success ml-2 has-text-weight-semibold">${formattedDuration}</span>
      </div>`;
      return li;
  }
  function refreshMeetings() {
      chrome.storage.sync.get('allMeetings', function (data) {
          const allMeetings = data.allMeetings || [];
          displayMeetingsInProgress(allMeetings);
          displayCompletedMeetings(allMeetings);
          makeTitlesEditable();
          setupExportLink();
      });
  }
  function groupMeetingsByDate(meetings) {
      return meetings.reduce((acc, meeting) => {
          const date = meeting.date;
          acc[date] = acc[date] || [];
          acc[date].push(meeting);
          return acc;
      }, {}); // Add index signature to the type of acc
  }
  function clearCompletedMeetings() {
      // alert to confirm the user wants to clear their meeting history
      const confirmClear = confirm('Are you sure you want to clear your meeting history? This action cannot be undone.');
      if (!confirmClear) {
          return;
      }
      chrome.storage.sync.get('allMeetings', function (data) {
          var _a;
          if (((_a = data === null || data === void 0 ? void 0 : data.allMeetings) === null || _a === void 0 ? void 0 : _a.length) === 0) {
              console.log('No recent meetings to clear');
              return;
          }
          // get the in-progress meetings (we don't want to clear them)
          const meetingsInProgress = data.allMeetings.filter((meeting) => meeting.status === MEETING_STATUS.IN_PROGRESS);
          // set the meetings to only the in-progress meetings
          chrome.storage.sync.set({ allMeetings: meetingsInProgress });
          // remove badge
          chrome.action.setBadgeText({ text: '' });
          refreshMeetings();
      });
  }
  function formatMeetingDuration(durationInSeconds) {
      // hours
      if (durationInSeconds >= 3600) {
          const hours = Math.floor(durationInSeconds / 3600);
          const minutes = Math.floor((durationInSeconds % 3600) / 60);
          return `${hours}h ${minutes}m`;
      }
      // minutes
      if (durationInSeconds >= 60) {
          const minutes = Math.floor(durationInSeconds / 60);
          const seconds = durationInSeconds % 60;
          return `${minutes}m ${seconds}s`;
      }
      // seconds
      return `${durationInSeconds}s`;
  }
  function makeTitlesEditable() {
      console.log('Making titles editable...');
      const titles = document.querySelectorAll('#meeting-title');
      titles.forEach(title => {
          const currentTitle = title.textContent;
          title.addEventListener('click', () => {
              title.setAttribute('contenteditable', 'true');
              title.focus();
          });
          title.addEventListener('blur', () => {
              title.setAttribute('contenteditable', 'false');
              title.focus();
              const newTitle = title.textContent;
              const meetingId = title.dataset.meetingId;
              if (newTitle === currentTitle) {
                  console.log('Title not changed');
                  return;
              }
              if (newTitle && meetingId) {
                  saveTitle(newTitle, meetingId);
              }
          });
      });
  }
  function saveTitle(newTitle, meetingId) {
      if (!newTitle.trim() || !meetingId) {
          console.error('Invalid title or meeting ID');
          return;
      }
      chrome.runtime.sendMessage({ action: 'updateTitle', meetingId, newTitle });
  }
  function setupExportLink() {
      chrome.storage.sync.get('allMeetings', function (data) {
          const allMeetings = data.allMeetings || [];
          const meetingsCompleted = allMeetings.filter((meeting) => meeting.status === MEETING_STATUS.COMPLETED);
          const formattedMeetings = meetingsCompleted.map(meeting => {
              return {
                  Title: meeting.title,
                  Date: meeting.date,
                  StartTime: meeting.startTime,
                  EndTime: meeting.endTime,
                  Duration: formatMeetingDuration(meeting.duration)
              };
          });
          console.log('Formatted meetings:', formattedMeetings);
          const csv = convertArrayOfObjectsToCSV(formattedMeetings);
          const downloadLink = document.getElementById('exportMeetingHistory');
          downloadLink.href = csv;
          downloadLink.download = 'meeting-history.csv';
      });
  }
  function convertArrayOfObjectsToCSV(data) {
      const columns = Object.keys(data[0]);
      let csv = columns.join(',') + '\n';
      csv += data
          .map(row => {
          // remove the comma from the date
          row.Date = row.Date.replace(',', '');
          return columns.map(col => row[col]).join(',');
      })
          .join('\n');
      return 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  }

})();
