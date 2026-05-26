// 1. Firebase SDK Realtime Database modules laden via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, child, update, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// JOUW FIREBASE CONFIGURATIE (Volledig gekoppeld aan jouw project)
const firebaseConfig = {
    apiKey: "AIzaSyAsXdb74t429pzITFezfh4s-y5qD_Jto5g",
    authDomain: "topvakantie-p5.firebaseapp.com",
    databaseURL: "https://topvakantie-p5-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "topvakantie-p5",
    storageBucket: "topvakantie-p5.firebasestorage.app",
    messagingSenderId: "1011108083968",
    appId: "1:1011108083968:web:4d6955b2c7879bb3809be5"
};

// Initialiseer Firebase & Realtime Database
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

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


// --- KAMPSPEL LOGICA (REALTIME DATABASE) ---
let gekozenTeam = localStorage.getItem('kamp_teamnaam') || null;

// Controleer status van aanmelden en luister live of het team nog bestaat
function checkTeamStatus() {
    const loginPanel = document.getElementById('game-login-panel');
    const playPanel = document.getElementById('game-play-panel');
    const displayGrid = document.getElementById('display-team-name');

    if (gekozenTeam) {
        // Luister live: Bestaat dit specifieke team nog in Firebase?
        const teamRef = ref(db, `teams/${gekozenTeam}`);
        onValue(teamRef, (snapshot) => {
            if (!snapshot.exists()) {
                // Team is door leiding gewist uit de db -> Log ze direct lokaal uit!
                localStorage.removeItem('kamp_teamnaam');
                gekozenTeam = null;
                
                // Reset de panelen onmiddellijk op het scherm
                loginPanel.classList.remove('hidden');
                playPanel.classList.add('hidden');
                document.getElementById('input-team-name').value = "";
                document.getElementById('game-feedback').textContent = "";
            } else {
                // Team bestaat gewoon, toon het spelscherm
                loginPanel.classList.add('hidden');
                playPanel.classList.remove('hidden');
                displayGrid.textContent = gekozenTeam;
            }
        });
    } else {
        // Geen team ingelogd, toon het startscherm
        loginPanel.classList.remove('hidden');
        playPanel.classList.add('hidden');
    }
}

// 1. Team registreren in de database
document.getElementById('btn-save-team').addEventListener('click', async () => {
    const inputName = document.getElementById('input-team-name').value.trim();
    
    if (inputName.length < 2) {
        alert("Vul een geldige teamnaam in van minstens 2 letters.");
        return;
    }

    gekozenTeam = inputName;
    localStorage.setItem('kamp_teamnaam', gekozenTeam);

    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `teams/${gekozenTeam}`));
    
    if (!snapshot.exists()) {
        await set(ref(db, `teams/${gekozenTeam}`), {
            teamNaam: gekozenTeam,
            score: 0,
            opgelosteRebussen: { "start_dummy": true }
        });
    }

    checkTeamStatus();
});

// 2. Antwoord controleren via /rebus (Met toLowerCase() en cheat-proof)
document.getElementById('btn-submit-answer').addEventListener('click', async () => {
    const inputAnswer = document.getElementById('input-rebus-answer').value.trim().toLowerCase();
    const feedbackEl = document.getElementById('game-feedback');
    
    if (!inputAnswer) return;
    if (!gekozenTeam) return;

    feedbackEl.className = ""; 
    feedbackEl.textContent = "Controleren...";

    try {
        const dbRef = ref(db);
        
        // Check in de map 'rebus' of het antwoord bestaat
        const rebusSnapshot = await get(child(dbRef, `rebus/${inputAnswer}`));

        if (rebusSnapshot.exists()) {
            const puntenToekennen = rebusSnapshot.val();

            const teamSnapshot = await get(child(dbRef, `teams/${gekozenTeam}`));
            
            if (!teamSnapshot.exists()) {
                feedbackEl.textContent = "Je team bestaat niet meer.";
                feedbackEl.classList.add('feedback-wrong');
                return;
            }

            const teamData = teamSnapshot.val();

            // Kijken of dit team deze rebus al een keer heeft opgelost
            if (teamData.opgelosteRebussen && teamData.opgelosteRebussen[inputAnswer]) {
                feedbackEl.textContent = "Juist, maar deze rebus hebben jullie al opgelost!";
                feedbackEl.classList.add('feedback-wrong');
            } else {
                // Bereken en verwerk de nieuwe score
                const nieuweScore = (teamData.score || 0) + puntenToekennen;
                
                const updates = {};
                updates[`/teams/${gekozenTeam}/score`] = nieuweScore;
                updates[`/teams/${gekozenTeam}/opgelosteRebussen/${inputAnswer}`] = true;

                await update(ref(db), updates);

                feedbackEl.textContent = `GEWELDIG! +${puntenToekennen} punten!`;
                feedbackEl.classList.add('feedback-correct');
                document.getElementById('input-rebus-answer').value = ""; 
            }
        } else {
            feedbackEl.textContent = "Helaas, dat antwoord is niet juist.";
            feedbackEl.classList.add('feedback-wrong');
        }
    } catch (error) {
        console.error(error);
        feedbackEl.textContent = "Verbindingsfout. Probeer het opnieuw.";
        feedbackEl.classList.add('feedback-wrong');
    }
});

// 3. Live scorebord via realtime luisteraar
function luisterNaarScorebord() {
    const teamsRef = ref(db, 'teams');
    
    onValue(teamsRef, (snapshot) => {
        const tbody = document.querySelector('#scoreboard-table tbody');
        tbody.innerHTML = ""; 

        if (!snapshot.exists()) return;

        const alleTeams = [];
        snapshot.forEach((childSnapshot) => {
            alleTeams.push(childSnapshot.val());
        });

        // Sorteer op de hoogste score
        alleTeams.sort((a, b) => b.score - a.score);

        alleTeams.forEach((teamData) => {
            const row = document.createElement('tr');
            
            // Highlight de rij als het je eigen ingelogde team is
            if (teamData.teamNaam === gekozenTeam) {
                row.classList.add('current-activity'); 
            }

            row.innerHTML = `
                <td>${teamData.teamNaam}</td>
                <td style="text-align: center; font-family: monospace; font-weight: 700;">${teamData.score}</td>
            `;
            tbody.appendChild(row);
        });
    });
}

// Applicatie officieel opstarten
createTable();
updateApp();
setInterval(updateApp, 1000);
checkTeamStatus();
luisterNaarScorebord();
