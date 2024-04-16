document.addEventListener('DOMContentLoaded', function () {
  const meetingList = document.getElementById('meetingList');

  // Load recent meetings from storage
  chrome.storage.sync.get('recentMeetings', function (data) {
    const recentMeetings = data.recentMeetings || [];

    // Display recent meetings in the UI by date (meeting.date)
    const meetingsByDate = groupMeetingsByDate(recentMeetings);

    for (const date in meetingsByDate) {
      const meetings = meetingsByDate[date];
      const dateHeader = document.createElement('h2');
      dateHeader.textContent = date;
      meetingList.appendChild(dateHeader);

      const ul = document.createElement('ul');
      meetings.forEach(meeting => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${meeting.title}</strong> - ${meeting.duration}`;
        ul.appendChild(li);
      });

      meetingList.appendChild(ul);
    }
  });

  // Clear recent meetings
  const clearButton = document.getElementById('clearMeetings');
  clearButton.addEventListener('click', function () {
    chrome.storage.sync.set({ recentMeetings: [] });
    meetingList.innerHTML = '';
  });
});

function groupMeetingsByDate(meetings) {
  return meetings.reduce((acc, meeting) => {
    const date = meeting.date;
    acc[date] = acc[date] || [];
    acc[date].push(meeting);
    return acc;
  }, {});
}
