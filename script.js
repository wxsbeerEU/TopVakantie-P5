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

// Helper functie: tijd naar minuten
function timeToMinutes(hour, minute) {
    return hour * 60 + minute;
}

// Data voorbereiden
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

// Tabel genereren
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

// Checkt of een tijdstip in de huidige activiteit valt
function isCurrentActivity(currentMins, startMins, endMins) {
    if (startMins < endMins) {
        // Normale situatie (bijv. 10:45 tot 11:05)
        return currentMins >= startMins && currentMins < endMins;
    } else if (startMins > endMins) {
        // Logica voor activiteit die over middernacht heen gaat (bijv. 22:30 tot 08:15)
        return currentMins >= startMins || currentMins < endMins;
    } else {
        // Logica voor twee activiteiten op EXACT hetzelfde moment (duur van 0 minuten)
        // Deze licht nu alleen op als het op de minuut af deze tijd is
        return currentMins === startMins;
    }
}

// UI updaten
function updateApp() {
    const now = new Date();
    const currentMinutes = timeToMinutes(now.getHours(), now.getMinutes());
    
    // Tijd formatteren (HH:MM:SS)
    const timeString = [now.getHours(), now.getMinutes(), now.getSeconds()]
        .map(n => String(n).padStart(2, '0'))
        .join(':');
    
    document.querySelector('#currentTime').textContent = timeString;

    // Activiteit zoeken en updaten
    betterSchedule.forEach((item, index) => {
        const row = document.getElementById(`row-${index}`);
        
        if (isCurrentActivity(currentMinutes, item.startMinutes, item.endMinutes)) {
            // Update het bovenste blok
            document.querySelector("#currentActivity").textContent = item.activity;
            document.querySelector("#currentActivityFrom").textContent = item.startTime;
            document.querySelector("#currentActivityTo").textContent = item.endTime;
            
            // Update tabel highlight
            row.classList.add('current-activity');
        } else {
            row.classList.remove('current-activity');
        }
    });
}

// Initialiseren
createTable();
updateApp();

// Elke seconde updaten voor de klok
setInterval(updateApp, 1000);
