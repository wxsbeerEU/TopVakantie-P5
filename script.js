const schedule = [
    { time: '8:15', activity: 'Opstaan' },
    { time: '8:30', activity: 'Ochtendeten' },
    { time: '9:15', activity: 'Lesmoment 1' },
    { time: '10:45', activity: 'Pauze' },
    { time: '11:05', activity: 'Lesmoment 2' },
    { time: '12:30', activity: 'Middageten - Vrije tijd' },
    { time: '13:45', activity: 'Lesmoment 3' },
    { time: '15:15', activity: 'Pauze' },
    { time: '15:20', activity: 'Namiddagactiviteit' },
    { time: '17:45', activity: 'Vrije tijd' },
    { time: '18:30', activity: 'Avondeten - Vrije tijd' },
    { time: '19:45', activity: 'Avondactiviteit' },
    { time: '21:30', activity: 'Vrije tijd - Bar' },
    { time: '22:00', activity: 'Niet meer douchen' },
    { time: '22:00', activity: 'Iedereen naar de kamers' },
    { time: '22:30', activity: 'Lichten uit - Slapen' }
];

let betterSchedule = [];

function timeToMinutes(hour, minute) {
    return hour * 60 + minute;
}

// Data verwerking
schedule.forEach((item, index, array) => {
    const [hour, minute] = item.time.split(':').map(Number);
    const nextItem = array[(index + 1) % array.length];
    const [nextHour, nextMinute] = nextItem.time.split(':').map(Number);

    betterSchedule.push({
        activity: item.activity,
        startTime: item.time,
        endTime: nextItem.time,
        startMinutes: timeToMinutes(hour, minute),
        endMinutes: timeToMinutes(nextHour, nextMinute)
    });
});

// Tabel opbouwen
function createTable() {
    const tbody = document.querySelector('#schedule-table tbody');
    betterSchedule.forEach((item, index) => {
        const row = document.createElement('tr');
        row.id = `row-${index}`;
        
        const timeCell = document.createElement('td');
        timeCell.classList.add("cell-time");
        timeCell.textContent = item.startTime;
        
        const activityCell = document.createElement('td');
        activityCell.classList.add("cell-activity");
        activityCell.textContent = item.activity;
        
        row.appendChild(timeCell);
        row.appendChild(activityCell);
        tbody.appendChild(row);
    });
}

function isCurrentActivity(currentMins, startMins, endMins) {
    if (startMins < endMins) {
        return currentMins >= startMins && currentMins < endMins;
    } else if (startMins > endMins) {
        return currentMins >= startMins || currentMins < endMins;
    } else {
        return currentMins === startMins;
    }
}

// Scherm updates
function updateApp() {
    const now = new Date();
    const currentMinutes = timeToMinutes(now.getHours(), now.getMinutes());
    
    const timeString = [now.getHours(), now.getMinutes(), now.getSeconds()]
        .map(n => String(n).padStart(2, '0'))
        .join(':');
    
    const currentTimeEl = document.querySelector('#currentTime');
    if (currentTimeEl) currentTimeEl.textContent = timeString;

    betterSchedule.forEach((item, index) => {
        const row = document.getElementById(`row-${index}`);
        
        if (isCurrentActivity(currentMinutes, item.startMinutes, item.endMinutes)) {
            const curAct = document.querySelector("#currentActivity");
            const curActFrom = document.querySelector("#currentActivityFrom");
            const curActTo = document.querySelector("#currentActivityTo");
            
            if (curAct) curAct.textContent = item.activity;
            if (curActFrom) curActFrom.textContent = item.startTime;
            if (curActTo) curActTo.textContent = item.endTime;
            
            if (row) row.classList.add('current-activity');
        } else {
            if (row) row.classList.remove('current-activity');
        }
    });
}

// Navigatie
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });
    document.getElementById(viewId).classList.remove('hidden');
    window.scrollTo(0, 0);
}

document.getElementById('btn-to-schedule').addEventListener('click', () => switchView('schedule-view'));
document.getElementById('btn-to-game').addEventListener('click', () => switchView('game-view'));
document.getElementById('btn-back-from-schedule').addEventListener('click', () => switchView('home-view'));
document.getElementById('btn-back-from-game').addEventListener('click', () => switchView('home-view'));

// Start
createTable();
updateApp();
setInterval(updateApp, 1000);
