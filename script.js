const endSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-complete-or-approved-mission-205.mp3');
const tickSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-clock-tick-1045.mp3');
const breakSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3');

tickSound.volume = 0.1;
endSound.volume = 0.5;
breakSound.volume = 0.5;

const input = document.getElementById("taskInput");
const button = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const filterButtons = document.querySelectorAll('.filter-btn');
const themeBtn = document.querySelector('#theme-button');
const importFile = document.getElementById('importFile');
const importBtn = document.getElementById('importBtn');

let tasks = [];
let currentFilter = 'all';
let globalTimerInterval = null;
let currentMode = 'work'
let breakTimeLeft = 0;  
let soundEnable = true;

const soundToggleBtn = document.getElementById('soundToggleBtn');
soundToggleBtn.addEventListener('click', () => {
    soundEnable = !soundEnable;
    soundToggleBtn.textContent = soundEnable ? '🔊 Sound On' : '🔇 Sound Off';
});

importBtn.addEventListener('click' , () => importFile.click());

importFile.addEventListener('change' , (event) =>{
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        try{
            const importedtasks = JSON.parse(e.target.result);
            

           
            tasks = normalizetasks([...tasks , ...importedtasks]);

            saveTasks();
            renderTasks();

            alert("Tasks imported successfully! 🎉");
        }catch (err){
            alert("Invalid JSON file.");
        }
    };
    reader.readAsText(file);
})


function normalizetasks(rawTasks){
    return rawTasks.map(task =>({
        ...task,

        priority: task.priority || 'medium',

        pomodoroTimeLeft: task.pomodoroTimeLeft || 0,
    }))
}

function exportTasks(){
    const jsonString = JSON.stringify(tasks , null , 2);

    const blob = new Blob([jsonString], { type: 'application/json'});

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "my-tasks.json"


    link.click();
    URL.revokeObjectURL(url);
}

document.getElementById('exportBtn').addEventListener('click' , exportTasks);


function showNotification(title, body) {
    if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification(title, {
            body: body,
            icon: "🍅",
            badge: "🍅",
            vibrate: [200, 100, 200],
            requireInteraction: true,
        });

        if (soundEnable) {
            endSound.play().catch(e => console.log("Sound play error:", e));
        }

        setTimeout(() => notification.close(), 10000);
    }
}

function startGlobalTimer(){
    if (globalTimerInterval) return;

    
    globalTimerInterval = setInterval(()=>{
        if (currentFocusIndex === null) {
            clearInterval(globalTimerInterval);
            globalTimerInterval = null;
            return;
        }

        const task = tasks[currentFocusIndex];

        if (task.pomodoroTimeLeft > 0 && !focusPaused) {
            task.pomodoroTimeLeft--;

            if (task.pomodoroTimeLeft <= 10 && soundEnable) {
                tickSound.play.catch(e => console.log("Tick error:" , e));
            }

if (task.pomodoroTimeLeft <= 0) {
    task.pomodoroTimeLeft = 0;
    
    tickSound.play().catch(e => console.log("Tick error:" , e));

    if (currentMode === 'work') {
        currentMode = 'break';
        task.pomodoroTimeLeft = breakTimeLeft;
        focusTaskTitle.textContent = `Break Time! ☕`;
        document.querySelector('.pomodoro-focus').style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';

        showNotification(
            "🎉 Work Session Complete!", 
            `Great job on "${task.text}"! Time for a 5-minute break.`
        );
    } else {
        showNotification(
            "☕ Break Time Over!", 
            "Time to get back to work! You've got this!"
        );
        closeFocusMode();
    }
}
        }
        updateFocusTimerDisplay();
    }, 1000);
}


const savedTheme = localStorage.getItem('theme') || 'light' ;
document.documentElement.setAttribute('data-theme' , savedTheme);

if (savedTheme === 'dark') {
    themeBtn.textContent = "☀️ Light Mode"
};

themeBtn.addEventListener('click' , () =>{
    let currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'

    console.log(currentTheme)
    document.documentElement.setAttribute('data-theme' , newTheme);

    localStorage.setItem('theme' , newTheme);

    themeBtn.textContent = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode' ; 
});


function loadTasks() {
    const saved = localStorage.getItem("tasks");
    if (saved) {
        tasks = normalizetasks(JSON.parse(saved));

        
        renderTasks();
        updateNoTasksMessage();
    }
    updateClearButton();
};


function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
};

function startEditing(index) {
    const task = tasks[index];

    const originalText = task.text;          

    const li = taskList.children[index];
    if (!li) return;

    const span = li.querySelector("span");
    if (!span) return;

    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.value = originalText;
    editInput.className = "edit-input";
    li.classList.add("editing");

    li.replaceChild(editInput, span);

    editInput.focus();
    editInput.select();

    const finishEditing = (shouldSave = true) => {
        li.classList.remove("editing");
        if (shouldSave) {
            const newText = editInput.value.trim();
            if (newText !== "") {
                tasks[index].text = newText;
            } else {
                tasks[index].text = originalText;     
            }
            saveTasks();
        }
        renderTasks();
    };

    editInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            finishEditing(true);
        }
    });

    editInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            finishEditing(false);
        }
    });

    editInput.addEventListener("blur", () => {
        finishEditing(true);
    });
}

function renderTasks() {
    let tasksToShow = tasks;
    taskList.innerHTML = "";

        if (currentFilter === 'active') {
            tasksToShow = tasks.filter(task => !task.completed);
        }else if (currentFilter === 'completed') {
            tasksToShow = tasks.filter(task => task.completed)
        }

    tasksToShow.forEach((task, index) => {


        const li = document.createElement("li");

        const span = document.createElement("span");
        span.textContent = task.text;

        const priorityBadge = document.createElement('span');
        priorityBadge.className = 'priority-badge';
        priorityBadge.classList.add(`priority-${task.priority || 'medium'}`);
        span.prepend(priorityBadge);

        const editbtn = document.createElement("button");
        editbtn.textContent = "✏️";
        editbtn.classList.add("edit-btn")
        
        editbtn.addEventListener('click' , () =>{
            startEditing(index);
            
        })

        const pomodoroBtn = document.createElement('button');
        pomodoroBtn.textContent = "🍅";
        pomodoroBtn.classList.add("pomodoro-btn");

        pomodoroBtn.addEventListener('click' , ()=>{
            startFocusMode(index);
        })

        li.appendChild(pomodoroBtn);


        if (task.completed) {
            span.classList.add("completed");
        }

        span.addEventListener("click", () => {
            tasks[index].completed = !tasks[index].completed;
            renderTasks();
            saveTasks();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "✖";
        deleteBtn.className = "delete-btn";
        deleteBtn.addEventListener("click", () => {
            tasks.splice(index, 1);
            renderTasks();
            saveTasks();
        });

        

        li.appendChild(span);
        li.appendChild(editbtn);
        li.appendChild(deleteBtn);
        


        taskList.appendChild(li);

    
    });
    new Sortable(taskList , {
        animation: 150,
      
        ghostClass: 'dragging',
        onEnd: (evt) => {
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;

            const [movedTask] = tasks.splice(oldIndex, 1 );
            tasks.splice(newIndex, 0 , movedTask );

            saveTasks();
            renderTasks();
        }
    })

    updateClearButton();
    updateCounter();
    updateNoTasksMessage();
}
clearCompletedBtn.addEventListener('click' , ()=>{
    const completedCount = tasks.filter(t => t.completed).length;

            if (!confirm(`Are you sure you want to delete ${completedCount} completed task${completedCount > 1 ? 's' : ''}?`)) {
                return;
            }

            const completedlis = Array.from(taskList.children).filter(li =>{
                const span = li.querySelector("span");
                return span && span.classList.contains("completed");
            });

            completedlis.forEach(li => {
                li.classList.add("task-removing");

            });


            setTimeout(()=>{
                tasks = tasks.filter(task => !task.completed);
                renderTasks();
                saveTasks();
            },450);



           
        })
function updateClearButton(){
                const hasComplated  =  tasks.some(task => task.completed);
                clearCompletedBtn.disabled = !hasComplated;
            }

function addTask() {
    const text = input.value.trim();

    if (text === "") {
        alert("Enter your Task...");
        return;
    }
    const priority = document.getElementById('prioritySelect').value;
    tasks.push({ text: text, completed: false , priority: priority});

    renderTasks();
    saveTasks();
    updateNoTasksMessage();

    input.value = "";
}

button.addEventListener("click", addTask);

input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        addTask();
    }
});
function updateCounter(){
    const remaining = tasks.filter(task => !task.completed).length;

    const counterEl = document.getElementById("tasksCounter");

    if (remaining === 0) {
        counterEl.innerHTML = "There are no more tasks 🎉";
    }else if (remaining === 1) {
        counterEl.innerHTML = "<strong>1</strong> task left";
    }else {
        counterEl.innerHTML = `<strong>${remaining}</strong> tasks left`;
    }
}

function updateNoTasksMessage(){
    const message = document.getElementById('noTasksMessage');
    if(tasks.length === 0){
        message.style.display = 'block';

    }else{
        message.style.display = 'none';
    }
}

filterButtons.forEach(btn => {
    btn.addEventListener('click' , ()=>{
        filterButtons.forEach(b => b.classList.remove('active'));

        btn.classList.add('active');

        currentFilter = btn.dataset.filter;

        renderTasks();
    });
});

loadTasks();
updateClearButton();

if ("Notification" in window) {
    if (Notification.permission === "default") {
        Notification.requestPermission();
    }
}

const focusOverlay = document.getElementById('focusOverlay');
const focusTaskTitle = document.getElementById('focusTaskTitle');
const focusTimer = document.getElementById('focusTimer');
const pauseResumeBtn = document.getElementById('pauseResumeBtn');
const resetFocusBtn = document.getElementById('resetFocusBtn');
const closeFocusBtn = document.getElementById('closeFocus');

let currentFocusIndex = null;
let focusPaused = false;

function startFocusMode(index) {
    const task = tasks[index];
    currentFocusIndex = index;
    focusPaused = false;

    
    focusTaskTitle.textContent = task.text;
    focusOverlay.classList.add('active');
    
    task.pomodoroTimeLeft = 25 * 60;
    currentMode = 'work';
    breakTimeLeft = 5 * 60;
    updateFocusTimerDisplay();  

    pauseResumeBtn.textContent = 'Pause';


     startGlobalTimer();
}

function updateFocusTimerDisplay() {
    if (currentFocusIndex === null) return;
    const task = tasks[currentFocusIndex];
    const minutes = Math.floor(task.pomodoroTimeLeft / 60);
    const seconds = task.pomodoroTimeLeft % 60;
    focusTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const totalSeconds = currentMode === 'work' ? (25 * 60) : breakTimeLeft;
    const progressPercent = 100 - (task.pomodoroTimeLeft / totalSeconds * 100);

    const progressCircle = document.getElementById('progressCircle');
    progressCircle.style.background = `conic-gradient(#2ecc71 0% ${progressPercent}%, transparent ${progressPercent}% 100%)`;

    if (task.pomodoroTimeLeft <= 60 && task.pomodoroTimeLeft > 0) {
        progressCircle.classList.add('low-time');
    } else {
        progressCircle.classList.remove('low-time');
    }
}

pauseResumeBtn.addEventListener('click', () => {
    focusPaused = !focusPaused;
    pauseResumeBtn.textContent = focusPaused ? 'Resume' : 'Pause';
});

resetFocusBtn.addEventListener('click', () => {
    if (confirm("Reset Pomodoro timer?")) {
        if (currentFocusIndex !== null) {
            tasks[currentFocusIndex].pomodoroTimeLeft = 0;
        }
        closeFocusMode();
    }
});

closeFocusBtn.addEventListener('click', closeFocusMode);

function closeFocusMode() {
    focusOverlay.classList.remove('active');
    if (currentFocusIndex !== null) {
        tasks[currentFocusIndex].pomodoroTimeLeft = 0;
        document.querySelector('.pomodoro-focus').style.background = 'linear-gradient(135deg, #1e3a8a, #3b82f6)';
        document.getElementById('progressCircle').style.background = 'conic-gradient(#2ecc71 0% 0%, transparent 0%)';
        currentFocusIndex = null;
        currentMode = 'work'
    }
    renderTasks();
    saveTasks();
    updateNoTasksMessage();
}

