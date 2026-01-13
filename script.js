const input = document.getElementById("taskInput");
const button = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const filterButtons = document.querySelectorAll('.filter-btn');

let tasks = [];
let currentFilter = 'all';


function loadTasks() {
    const saved = localStorage.getItem("tasks");
    if (saved) {
        tasks = JSON.parse(saved);
        renderTasks();
    }
    updateClearButton();
}

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

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

        const editbtn = document.createElement("button");
        editbtn.textContent = "✏️";
        editbtn.classList.add("edit-btn")
        
        editbtn.addEventListener('click' , () =>{
            startEditing(index);
            
        })

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

    updateClearButton();
    updateCounter();
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

    tasks.push({ text: text, completed: false });

    renderTasks();
    saveTasks();

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