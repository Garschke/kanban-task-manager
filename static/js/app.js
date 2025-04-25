// static/js/app.js
$(document).ready(function() {
    initDragAndDrop();
    loadTasks();
    setupEventHandlers();
});

function initDragAndDrop() {
    $(".tasks-list").sortable({
        connectWith: ".tasks-list",
        placeholder: "task-placeholder",
        update: function(event, ui) {
            const taskId = ui.item.data("task-id");
            const newStatus = ui.item.parent().parent().data("status");
            const newPosition = ui.item.index();

            updateTask(taskId, {
                status: newStatus,
                position: newPosition
            });
        }
    }).disableSelection();
}

function setupEventHandlers() {
    // Add task handler
    $(".add-task-btn").click(addNewTask);
    $(".new-task-title").keypress(function(e) {
        if (e.which === 13) addNewTask.call(this);
    });

    // Task click handler
    $(document).on('click', '.task-card', showTaskDetails);

    // Modal button handlers
    $("#taskModal").on('shown.bs.modal', function() {
        $(".task-title").focus();
    });

    $(".save-task-btn").click(saveTaskChanges);
    $(".delete-task-btn").click(deleteCurrentTask);
}

function addNewTask() {
    const column = $(this).closest(".kanban-column");
    const title = column.find(".new-task-title").val().trim();

    if (title) {
        createTask({
            title: title,
            status: column.data("status"),
            position: column.find(".tasks-list").children().length
        });
        column.find(".new-task-title").val('').focus();
    }
}

function showTaskDetails() {
    const taskId = $(this).data("task-id");
    $.get(`/api/tasks/${taskId}`)
        .done(function(task) {
            $("#taskModal .task-title").val(task.title);
            $("#taskModal .task-description").val(task.description || '');
            $("#taskModal").data("task-id", taskId);
            $("#taskModal").modal("show");
        })
        .fail(showError("Loading task details"));
}

function saveTaskChanges() {
    const taskId = $("#taskModal").data("task-id");
    const title = $("#taskModal .task-title").val().trim();
    const description = $("#taskModal .task-description").val().trim();

    if (!title) {
        alert("Title cannot be empty");
        return;
    }

    updateTask(taskId, {
        title: title,
        description: description
    });
    $("#taskModal").modal("hide");
}

function deleteCurrentTask() {
    if (!confirm("Are you sure you want to delete this task?")) return;

    const taskId = $("#taskModal").data("task-id");
    deleteTask(taskId);
    $("#taskModal").modal("hide");
}

// CRUD Operations
function loadTasks() {
    $.get('/api/tasks')
        .done(function(tasks) {
            tasks.forEach(renderTask);
        })
        .fail(showError("Loading tasks"));
}

function createTask(taskData) {
    $.ajax({
        url: '/api/tasks',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(taskData),
        dataType: 'json'
    })
    .done(function(newTask) {
        renderTask(newTask);
    })
    .fail(showError("Creating task"));
}

function updateTask(taskId, updateData) {
    $.ajax({
        url: `/api/tasks/${taskId}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(updateData),
        dataType: 'json'
    })
    .done(function(updatedTask) {
        $(`[data-task-id="${taskId}"]`).remove();
        renderTask(updatedTask);
    })
    .fail(showError("Updating task"));
}

function deleteTask(taskId) {
    $.ajax({
        url: `/api/tasks/${taskId}`,
        method: 'DELETE'
    })
    .done(function() {
        $(`[data-task-id="${taskId}"]`).remove();
    })
    .fail(showError("Deleting task"));
}

// Helper functions
function renderTask(task) {
    const taskHtml = `
        <div class="task-card" data-task-id="${task.id}">
            <h3>${task.title}</h3>
            ${task.description ? `<p>${task.description}</p>` : ''}
        </div>
    `;
    $(`#${task.status.replace('_', '-')}-tasks`).append(taskHtml);
}

function showError(action) {
    return function(jqXHR, textStatus, errorThrown) {
        console.error(`${action} failed:`, textStatus, errorThrown, jqXHR);
        alert(`${action} failed. Check console for details.`);
    };
}