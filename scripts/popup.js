document.addEventListener('DOMContentLoaded', function () {
  // Load recent meetings from storage
  refreshMeetings();

  // Add event listener to clear recent meetings button
  const clearButton = document.getElementById('clearRecentMeetings');
  clearButton.addEventListener('click', clearRecentMeetings);
});

function displayMeetingsInProgress(meetings) {
  // clear the list
  const meetingsInProgressList = document.getElementById('meetingsInProgress');
  meetingsInProgressList.innerHTML = '';

  // filter the meetings that are in progress
  const meetingsInProgress = meetings.filter(
    meeting => meeting.status === 'in-progress'
  );

  if (meetingsInProgress.length === 0) return;

  const container = document.createElement('div');
  const ul = document.createElement('ul');
  meetingsInProgress.forEach(meeting => {
    const li = document.createElement('li');
    li.innerHTML = `
    <div class="is-flex is-justify-content-space-between is-align-items-center has-background-danger-light px-4 py-2 is-size-7">
      <div class="">
        <p class="has-text-weight-bold">${meeting.title}</p>
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

function displayRecentMeetings(meetings) {
  // clear the list
  const recentMeetingsList = document.getElementById('recentMeetings');
  recentMeetingsList.innerHTML = '';

  // filter the meetings that are completed
  const meetingsCompleted = meetings.filter(
    meeting => meeting.status === 'completed'
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

  for (const date in meetingsByDate) {
    // Date header
    const dateHeader = document.createElement('p');
    dateHeader.textContent = date;
    dateHeader.classList.add(
      'has-text-weight-bold',
      'mb-1',
      'is-size-7',
      'has-text-link'
    );

    recentMeetingsList.appendChild(dateHeader);

    // Meetings
    const meetings = meetingsByDate[date];

    const container = document.createElement('div');

    const ul = document.createElement('ul');
    meetings.forEach(meeting => {
      const li = document.createElement('li');
      const formattedDuration = formatMeetingDuration(
        meeting.cumulativeDuration
      );

      li.innerHTML = `
      <div class="is-flex is-justify-content-space-between is-align-items-center has-background-light px-2 py-1 mb-1 is-size-7" style="border-radius: 4px;">
        <div>
          <p><strong>${meeting.title}</strong></p>
          <p class="is-size-8 has-text-grey">
            ${meeting.startTime} - ${meeting.endTime}
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

function refreshMeetings() {
  chrome.storage.sync.get('recentMeetings', function (data) {
    const recentMeetings = data.recentMeetings || [];

    displayMeetingsInProgress(recentMeetings);
    displayRecentMeetings(recentMeetings);
  });
}

function groupMeetingsByDate(meetings) {
  return meetings.reduce((acc, meeting) => {
    const date = meeting.date;
    acc[date] = acc[date] || [];
    acc[date].push(meeting);
    return acc;
  }, {});
}

function clearRecentMeetings() {
  // alert to confirm the user wants to clear the recent meetings
  const confirmClear = confirm(
    'Are you sure you want to clear your meeting history? This action cannot be undone.'
  );

  if (!confirmClear) {
    return;
  }

  chrome.storage.sync.get('recentMeetings', function (data) {
    if (data.recentMeetings.length === 0) {
      console.log('No recent meetings to clear');
      return;
    }

    // get the in-progress meetings (we don't want to clear them)
    const meetingsInProgress = data.recentMeetings.filter(
      meeting => meeting.status === 'in-progress'
    );

    // set the recent meetings to only the in progress meetings
    chrome.storage.sync.set({ recentMeetings: meetingsInProgress });

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
