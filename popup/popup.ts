import { MEETING_STATUS, MeetingDetails } from '../types';

document.addEventListener('DOMContentLoaded', function () {
  refreshMeetings();
  initClearButton();
});

function initClearButton(): void {
  const clearButton = document.getElementById(
    'clearRecentMeetings'
  ) as HTMLButtonElement;
  clearButton?.addEventListener('click', clearRecentMeetings);
}

function displayMeetingsInProgress(meetings: MeetingDetails[]): void {
  // clear the list
  const meetingsInProgressList = document.getElementById('meetingsInProgress');

  if (!meetingsInProgressList) {
    console.error('Meetings in progress list not found');
    return;
  }

  meetingsInProgressList.innerHTML = '';

  // filter the meetings that are in progress
  const meetingsInProgress = meetings.filter(
    meeting => meeting.status === MEETING_STATUS.IN_PROGRESS
  );

  if (meetingsInProgress.length === 0) return;

  const container = document.createElement('div');
  const ul = document.createElement('ul');
  meetingsInProgress.forEach(meeting => {
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
    ul.appendChild(li);
  });

  container.appendChild(ul);
  meetingsInProgressList.appendChild(container);
}

function displayRecentMeetings(meetings: MeetingDetails[]): void {
  // clear the list
  const recentMeetingsList = document.getElementById('recentMeetings');

  if (!recentMeetingsList) {
    console.error('Recent meetings list not found');
    return;
  }

  recentMeetingsList.innerHTML = '';

  // filter the meetings that are completed
  const meetingsCompleted = meetings.filter(
    meeting => meeting.status === MEETING_STATUS.COMPLETED
  );

  if (meetingsCompleted.length === 0) {
    const container = document.createElement('div');
    container.classList.add('has-background-light', 'p-2');

    const p = document.createElement('p');
    p.textContent = 'No recent meetings';
    p.classList.add('is-size-7', 'has-text-grey');
    container.appendChild(p);

    recentMeetingsList.appendChild(container);
    return;
  }

  const meetingsByDate = groupMeetingsByDate(meetingsCompleted);

  let index = 0;
  for (const date in meetingsByDate) {
    // Date header
    const dateHeader = document.createElement('p');
    dateHeader.textContent = date;
    dateHeader.classList.add(
      'has-text-weight-bold',
      'mb-1',
      'is-size-7',
      'has-text-link',
      index === 0 ? 'mt-0' : 'mt-4'
    );
    index++;

    recentMeetingsList.appendChild(dateHeader);

    // Meetings
    const meetings = meetingsByDate[date];

    const container = document.createElement('div');

    const ul = document.createElement('ul');
    meetings.forEach(meeting => {
      const li = document.createElement('li');
      const formattedDuration = formatMeetingDuration(meeting.duration);

      const meetingTime =
        meeting.startTime !== meeting.endTime
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

      ul.appendChild(li);
    });

    container.appendChild(ul);
    recentMeetingsList.appendChild(container);
  }
}

function refreshMeetings(): void {
  chrome.storage.sync.get('recentMeetings', function (data) {
    const recentMeetings = data.recentMeetings || [];

    displayMeetingsInProgress(recentMeetings);
    displayRecentMeetings(recentMeetings);
    makeTitlesEditable();
  });
}

function groupMeetingsByDate(meetings: MeetingDetails[]) {
  return meetings.reduce((acc, meeting) => {
    const date = meeting.date;
    acc[date] = acc[date] || [];
    acc[date].push(meeting);
    return acc;
  }, {} as Record<string, MeetingDetails[]>); // Add index signature to the type of acc
}

function clearRecentMeetings(): void {
  // alert to confirm the user wants to clear the recent meetings
  const confirmClear = confirm(
    'Are you sure you want to clear your meeting history? This action cannot be undone.'
  );

  if (!confirmClear) {
    return;
  }

  chrome.storage.sync.get('recentMeetings', function (data) {
    if (data?.recentMeetings?.length === 0) {
      console.log('No recent meetings to clear');
      return;
    }

    // get the in-progress meetings (we don't want to clear them)
    const meetingsInProgress = data.recentMeetings.filter(
      (meeting: MeetingDetails) => meeting.status === MEETING_STATUS.IN_PROGRESS
    );

    // set the recent meetings to only the in progress meetings
    chrome.storage.sync.set({ recentMeetings: meetingsInProgress });

    // remove badge
    chrome.action.setBadgeText({ text: '' });

    refreshMeetings();
  });
}

function formatMeetingDuration(durationInSeconds: number): string {
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

function makeTitlesEditable(): void {
  console.log('Making titles editable...');

  const titles = document.querySelectorAll(
    '#meeting-title'
  ) as NodeListOf<HTMLElement>;

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

function saveTitle(newTitle: string, meetingId: string): void {
  if (!newTitle.trim() || !meetingId) {
    console.error('Invalid title or meeting ID');
    return;
  }

  chrome.runtime.sendMessage({ action: 'updateTitle', meetingId, newTitle });
}
