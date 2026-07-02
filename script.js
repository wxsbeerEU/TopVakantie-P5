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
    // Dit lost het probleem op van dubbele tijden (zoals 22:00)
    for (let i = index + 1; i < array.length; i++) {
        const [nextHour, nextMinute] = array[i].time.split(':').map(Number);
        const nextMins = timeToMinutes(nextHour, nextMinute);
        if (nextMins > startMins) {
            endMins = nextMins;
            break;
        }
    }

    // Als er geen latere activiteit is gevonden, is dit de laatste van de dag (loopt tot 23:59 of tot de volgende ochtend)
    if (endMins === startMins) {
        // We laten de laatste activiteit lopen tot het einde van de dag (23:59 -> 1439 minuten)
        // Of tot de volgende ochtend (8:15). We kiezen hier voor de overbrugging naar de volgende dag:
        const [firstHour, firstMinute] = array[0].time.split(':').map(Number);
        endMins = timeToMinutes(firstHour, firstMinute); // Loopt door tot 8:15 de volgende dag
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
    tbody.innerHTML = ""; // Handig bij eventuele herladen

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
    // Normale situatie op dezelfde dag (bijv. 8:15 tot 8:30)
    if (startMins < endMins) {
        return currentMins >= startMins && currentMins < endMins;
    } 
    // Situatie die over middernacht heen gaat (bijv. 22:30 tot 8:15)
    else if (startMins > endMins) {
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
        
        // Er mag er maar eentje tegelijk oplichten. Als er al een match is (bijv. bij gelijke tijden), 
        // krijgt de laatste activiteit op dat tijdstip de prioriteit.
        if (!activeFound && isCurrentActivity(currentMinutes, item.startMinutes, item.endMinutes)) {
            
            // Extra check voor gelijke starttijden (zoals 22:00): we lichten de activiteit op die
            // het verst in de lijst staat óf we controleren of er een exacte match is.
            // Om te zorgen dat er maar ÉÉN oplicht, controleren we of de volgende in de lijst ook op exact dezelfde tijd start.
            // Zo ja, dan skippen we deze en lichten we de volgende (of laatste) van die minuut op.
            const nextItem = betterSchedule[index + 1];
            if (nextItem && nextItem.startMinutes === item.startMinutes) {
                if (row) row.classList.remove('current-activity');
                return; 
            }

            const curAct = document.querySelector("#currentActivity");
            const curActFrom = document.querySelector("#currentActivityFrom");
            const curActTo = document.querySelector("#currentActivityTo");
            
            if (curAct) curAct.textContent = item.activity;
            
            // Bepaal de mooie weergave van de eindtijd
            let displayEndTime = item.startTime;
            for (let i = index + 1; i < betterSchedule.length; i++) {
                if (betterSchedule[i].startMinutes > item.startMinutes) {
                    displayEndTime = betterSchedule[i].startTime;
                    break;
                }
            }
            if (displayEndTime === item.startTime && index === betterSchedule.length - 1) {
                displayEndTime = schedule[0].time; // Terug naar de ochtend
            }

            if (curActFrom) curActFrom.textContent = item.startTime;
            if (curActTo) curActTo.textContent = displayEndTime;
            
            if (row) row.classList.add('current-activity');
            activeFound = true; // Zorgt dat er geen andere rijen meer worden geactiveerd
        } else {
            if (row) row.classList.remove('current-activity');
        }
    });
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.remove('hidden');
    window.scrollTo(0, 0);
}

// Navigatie knoppen
document.getElementById('btn-to-schedule')?.addEventListener('click', () => switchView('schedule-view'));
document.getElementById('btn-to-game')?.addEventListener('click', () => switchView('game-view'));
document.getElementById('btn-back-from-schedule')?.addEventListener('click', () => switchView('home-view'));
document.getElementById('btn-back-from-game')?.addEventListener('click', () => switchView('home-view'));

// Applicatie officieel opstarten
createTable();
updateApp();
setInterval(updateApp, 1000);
