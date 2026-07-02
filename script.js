// --- DAGPLANNING & KLOK LOGICA ---
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

// Bouw de planning om met correcte start- en eindtijden
schedule.forEach((item, index, array) => {
    const [hour, minute] = item.time.split(':').map(Number);
    const startMins = timeToMinutes(hour, minute);
    let endMins = startMins;

    // Zoek naar de eerstvolgende activiteit die op een LATER tijdstip begint
    for (let i = index + 1; i < array.length; i++) {
        const [nextHour, nextMinute] = array[i].time.split(':').map(Number);
        const nextMins = timeToMinutes(nextHour, nextMinute);
        if (nextMins > startMins) {
            endMins = nextMins;
            break;
        }
    }

    // Als er geen latere activiteit is gevonden, koppelen we deze aan de start van de volgende ochtend
    if (endMins === startMins) {
        const [firstHour, firstMinute] = array[0].time.split(':').map(Number);
        endMins = timeToMinutes(firstHour, firstMinute); 
    }

    betterSchedule.push({
        activity: item.activity,
        startTime: item.time,
        startMinutes: startMins,
        endMinutes: endMins
    });
});

function createTable() {
    const tbody = document.querySelector('#schedule-table tbody');
    if (!tbody) return;
    tbody.innerHTML = ""; 

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
    }
    return false;
}

function updateApp() {
    const now = new Date();
    const currentMinutes = timeToMinutes(now.getHours(), now.getMinutes());
    
    const timeString = [now.getHours(), now.getMinutes(), now.getSeconds()]
        .map(n => String(n).padStart(2, '0'))
        .join(':');
    
    const currentTimeEl = document.querySelector('#currentTime');
    if (currentTimeEl) currentTimeEl.textContent = timeString;

    let activeFound = false;

    betterSchedule.forEach((item, index) => {
        const row = document.getElementById(`row-${index}`);
        
        if (!activeFound && isCurrentActivity(currentMinutes, item.startMinutes, item.endMinutes)) {
            
            // Controleer of het volgende item op exact dezelfde minuut start (bijv. de dubbele 22:00)
            // Zo ja, sla deze over zodat de laatste van die minuut oplicht.
            const nextItem = betterSchedule[index + 1];
            if (nextItem && nextItem.startMinutes === item.startMinutes) {
                if (row) row.classList.remove('current-activity');
                return; 
            }

            const curAct = document.querySelector("#currentActivity");
            const curActFrom = document.querySelector("#currentActivityFrom");
            const curActTo = document.querySelector("#currentActivityTo");
            
            if (curAct) curAct.textContent = item.activity;
            
            let displayEndTime = item.startTime;
            for (let i = index + 1; i < betterSchedule.length; i++) {
                if (betterSchedule[i].startMinutes > item.startMinutes) {
                    displayEndTime = betterSchedule[i].startTime;
                    break;
                }
            }
            if (displayEndTime === item.startTime && index === betterSchedule.length - 1) {
                displayEndTime = schedule[0].time; 
            }

            if (curActFrom) curActFrom.textContent = item.startTime;
            if (curActTo) curActTo.textContent = displayEndTime;
            
            if (row) row.classList.add('current-activity');
            activeFound = true; 
        } else {
            if (row) row.classList.remove('current-activity');
        }
    });
}

// Applicatie officieel opstarten
createTable();
updateApp();
setInterval(updateApp, 1000);
