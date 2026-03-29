// 获取页面元素
const titleInput = document.getElementById('title-input');
const contentInput = document.getElementById('content-input');
const submitBtn = document.getElementById('submit-btn');
const todoList = document.getElementById('todo-list');
const todoCount = document.getElementById('todo-count');
const recycleBtn = document.getElementById('recycle-btn');
const completedBtn = document.getElementById('completed-btn');
const completeAllBtn = document.querySelector('.complete-all');
const deleteAllBtn = document.querySelector('.delete-all');
const prioritySelect = document.getElementById('priority-select');
const categoryInput = document.getElementById('category-input');
const filterBtn = document.getElementById('filter-btn');
const dueDateInput = document.getElementById('due-date-input');

// 用数组保存笔记、已完成和回收站
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let completed = JSON.parse(localStorage.getItem('completed')) || [];
let recycle = JSON.parse(localStorage.getItem('recycle')) || [];
let viewMode = 'notes'; // notes / completed / recycle
let filterMode = null; // null or category string

// 迁移旧数据
todos = todos.map(todo => {
    const base = {
        id: todo.id || Date.now().toString(),
        title: todo.title || todo.text || '无标题',
        content: todo.content || '',
        priority: todo.priority || 'medium',
        category: todo.category || '',
        dueDate: todo.dueDate || null,
        createdAt: todo.createdAt || Number(todo.id) || Date.now()
    };
    return base;
});
completed = completed.map(todo => ({
    id: todo.id || Date.now().toString(),
    title: todo.title || todo.text || '无标题',
    content: todo.content || '',
    priority: todo.priority || 'medium',
    category: todo.category || '',
    dueDate: todo.dueDate || null,
    createdAt: todo.createdAt || Number(todo.id) || Date.now()
}));
recycle = recycle.map(todo => ({
    id: todo.id || Date.now().toString(),
    title: todo.title || todo.text || '无标题',
    content: todo.content || '',
    priority: todo.priority || 'medium',
    category: todo.category || '',
    dueDate: todo.dueDate || null,
    createdAt: todo.createdAt || Number(todo.id) || Date.now()
}));
saveData(); // 保存迁移后的数据

// 渲染列表
function renderList() {
    todoList.innerHTML = '';
    let list = viewMode === 'recycle' ? recycle : viewMode === 'completed' ? completed : todos;
    const isRecycle = viewMode === 'recycle';

    // 过滤分类
    if (filterMode && viewMode === 'notes') {
        list = list.filter(item => item.category === filterMode);
    }

    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const sortedList = [...list].sort((a, b) => {
        const diff = (priorityOrder[b.priority || 'medium'] || 2) - (priorityOrder[a.priority || 'medium'] || 2);
        if (diff !== 0) return diff;
        // 同优先级新创建的放在上面
        return (b.createdAt || 0) - (a.createdAt || 0);
    });

    for (const item of sortedList) {
        const div = document.createElement('div');
        div.className = 'todo-item';
        div.classList.add(`priority-${item.priority || 'medium'}`);
        if (item.dueDate && new Date(item.dueDate) < new Date()) {
            div.classList.add('overdue');
        }
        div.dataset.id = item.id;

        const categorySpan = item.category ? `<span class="category">[${item.category}]</span>` : '';

        if (isRecycle) {
            div.innerHTML = `
                ${categorySpan}<h4>${item.title}</h4>
                <p>${item.content || '无内容'}</p>
                <div class="actions">
                    <button class="restore-btn">恢复</button>
                    <button class="delete-btn">永久删除</button>
                </div>
            `;
            div.querySelector('.restore-btn').addEventListener('click', () => restoreNote(item.id));
            div.querySelector('.delete-btn').addEventListener('click', () => deletePermanently(item.id));
        } else if (viewMode === 'completed') {
            div.innerHTML = `
                ${categorySpan}<h4>${item.title}</h4>
                <p>${item.content || '无内容'}</p>
                <div class="actions">
                    <button class="restore-btn">取消完成</button>
                    <button class="delete-btn">删除</button>
                </div>
            `;
            div.querySelector('.restore-btn').addEventListener('click', () => uncompleteNote(item.id));
            div.querySelector('.delete-btn').addEventListener('click', () => deleteCompleted(item.id));
        } else {
            div.innerHTML = `
                <span class="mark-complete" title="标记已完成">○</span>
                ${categorySpan}<h4>${item.title}</h4>
                <p>${item.content || '无内容'}</p>
                <button class="delete-btn">删除</button>
            `;
            div.querySelector('.mark-complete').addEventListener('click', () => completeNote(item.id));
            div.addEventListener('dblclick', () => editNote(div, item));
            div.querySelector('.delete-btn').addEventListener('click', () => deleteNote(item.id));
        }

        todoList.appendChild(div);
    }
    updateCount();
}

// 保存到 localStorage
function saveData() {
    localStorage.setItem('todos', JSON.stringify(todos));
    localStorage.setItem('completed', JSON.stringify(completed));
    localStorage.setItem('recycle', JSON.stringify(recycle));
}

// 更新数量
function updateCount() {
    if (viewMode === 'recycle') {
        todoCount.textContent = `回收站 ${recycle.length} 项`;
    } else if (viewMode === 'completed') {
        todoCount.textContent = `已完成 ${completed.length} 项`;
    } else {
        todoCount.textContent = `剩余 ${todos.length} 项笔记`;
    }
}

// 删除笔记到回收站
function deleteNote(id) {
    const index = todos.findIndex(t => t.id === id);
    if (index > -1) {
        const note = todos.splice(index, 1)[0];
        recycle.push(note);
        saveData();
        renderList();
    }
}

function completeNote(id) {
    const index = todos.findIndex(t => t.id === id);
    if (index > -1) {
        const note = todos.splice(index, 1)[0];
        completed.unshift(note);
        saveData();
        renderList();
    }
}

function uncompleteNote(id) {
    const index = completed.findIndex(t => t.id === id);
    if (index > -1) {
        const note = completed.splice(index, 1)[0];
        todos.unshift(note);
        saveData();
        renderList();
    }
}

function deleteCompleted(id) {
    const index = completed.findIndex(t => t.id === id);
    if (index > -1) {
        const note = completed.splice(index, 1)[0];
        recycle.push(note);
        saveData();
        renderList();
    }
}

// 恢复笔记
function restoreNote(id) {
    const index = recycle.findIndex(t => t.id === id);
    if (index > -1) {
        const note = recycle.splice(index, 1)[0];
        todos.unshift(note);
        saveData();
        renderList();
    }
}

// 永久删除
function deletePermanently(id) {
    const index = recycle.findIndex(t => t.id === id);
    if (index > -1) {
        recycle.splice(index, 1);
        saveData();
        renderList();
    }
}

function completeAllNotes() {
    if (todos.length === 0) return;
    completed = [...todos, ...completed];
    todos = [];
    saveData();
    renderList();
}

function deleteAllNotes() {
    if (todos.length === 0) return;
    recycle = [...todos, ...recycle];
    todos = [];
    saveData();
    renderList();
}

function getAllCategories() {
    const allItems = [...todos, ...completed, ...recycle];
    const categories = new Set();
    allItems.forEach(item => {
        if (item.category) categories.add(item.category);
    });
    return Array.from(categories).sort();
}

// 编辑笔记
function editNote(item, todo) {
    const h4 = item.querySelector('h4');
    const p = item.querySelector('p');

    // 创建输入框
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = todo.title;
    titleInput.className = 'edit-title';
    titleInput.style.width = '100%';
    titleInput.style.fontSize = '16px';
    titleInput.style.fontWeight = 'bold';
    titleInput.style.border = '1px solid #ccc';
    titleInput.style.borderRadius = '4px';
    titleInput.style.padding = '5px';

    const contentTextarea = document.createElement('textarea');
    contentTextarea.value = todo.content;
    contentTextarea.className = 'edit-content';
    contentTextarea.style.width = '100%';
    contentTextarea.style.height = '60px';
    contentTextarea.style.fontSize = '14px';
    contentTextarea.style.border = '1px solid #ccc';
    contentTextarea.style.borderRadius = '4px';
    contentTextarea.style.padding = '5px';
    contentTextarea.style.resize = 'vertical';

    const categoryInput = document.createElement('input');
    categoryInput.type = 'text';
    categoryInput.value = todo.category;
    categoryInput.className = 'edit-category';
    categoryInput.style.width = '100%';
    categoryInput.style.fontSize = '14px';
    categoryInput.style.border = '1px solid #ccc';
    categoryInput.style.borderRadius = '4px';
    categoryInput.style.padding = '5px';
    categoryInput.placeholder = '分类（可选）';

    const dueDateInput = document.createElement('input');
    dueDateInput.type = 'datetime-local';
    dueDateInput.value = todo.dueDate || '';
    dueDateInput.className = 'edit-due-date';
    dueDateInput.style.width = '100%';
    dueDateInput.style.fontSize = '14px';
    dueDateInput.style.border = '1px solid #ccc';
    dueDateInput.style.borderRadius = '4px';
    dueDateInput.style.padding = '5px';

    // 替换元素
    item.replaceChild(titleInput, h4);
    item.replaceChild(contentTextarea, p);
    item.insertBefore(categoryInput, item.querySelector('.actions') || item.lastElementChild);
    item.insertBefore(dueDateInput, item.querySelector('.actions') || item.lastElementChild);

    titleInput.focus();

    // 保存函数
    const saveEdit = () => {
        const newTitle = titleInput.value.trim();
        const newContent = contentTextarea.value.trim();
        const newCategory = categoryInput.value.trim();
        const newDueDate = dueDateInput.value || null;
        if (newTitle) {
            todo.title = newTitle;
            todo.content = newContent;
            todo.category = newCategory;
            todo.dueDate = newDueDate;
            saveData();
            renderList();
        } else {
            alert('标题不能为空');
            titleInput.focus();
        }
    };

    // 事件监听
    // 移除 blur 事件，避免点击切换时意外保存
    titleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            contentTextarea.focus();
        } else if (e.key === 'Escape') {
            renderList(); // 取消编辑
        }
    });
    contentTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            categoryInput.focus();
        } else if (e.key === 'Escape') {
            renderList(); // 取消编辑
        }
    });
    categoryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            dueDateInput.focus();
        } else if (e.key === 'Escape') {
            renderList(); // 取消编辑
        }
    });
    dueDateInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            renderList(); // 取消编辑
        }
    });
}

// 添加笔记
function addTodo() {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    if (!title) {
        alert('请输入笔记标题');
        return;
    }
    const note = {
        id: Date.now().toString(),
        title: title,
        content: content,
        priority: prioritySelect.value || 'medium',
        category: categoryInput.value.trim(),
        dueDate: dueDateInput.value || null,
        createdAt: Date.now()
    };
    todos.unshift(note); // 插在最前面
    saveData();
    renderList();
    titleInput.value = '';
    contentInput.value = '';
    categoryInput.value = '';
    dueDateInput.value = '';
}

submitBtn.addEventListener('click', addTodo);

titleInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        addTodo();
    }
});

completeAllBtn.addEventListener('click', completeAllNotes);
deleteAllBtn.addEventListener('click', deleteAllNotes);

completedBtn.addEventListener('click', () => {
    viewMode = viewMode === 'completed' ? 'notes' : 'completed';
    refreshButtons();
    renderList();
});

recycleBtn.addEventListener('click', () => {
    viewMode = viewMode === 'recycle' ? 'notes' : 'recycle';
    refreshButtons();
    renderList();
});

// 过滤按钮
let dropdown = null;
let hideTimeout = null;

filterBtn.addEventListener('mouseenter', () => {
    if (dropdown) return;
    const categories = getAllCategories();
    if (categories.length === 0) return;

    dropdown = document.createElement('div');
    dropdown.className = 'category-dropdown';
    categories.forEach(cat => {
        const div = document.createElement('div');
        div.textContent = cat;
        div.addEventListener('click', () => {
            filterMode = cat;
            viewMode = 'notes'; // 确保在笔记模式
            refreshButtons();
            renderList();
            hideDropdown();
        });
        dropdown.appendChild(div);
    });
    filterBtn.parentNode.appendChild(dropdown);
    dropdown.style.display = 'block';

    // 添加dropdown的事件监听
    dropdown.addEventListener('mouseenter', () => {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
    });
    dropdown.addEventListener('mouseleave', () => {
        hideDropdown();
    });
});

filterBtn.addEventListener('mouseleave', () => {
    if (!dropdown) return;
    hideTimeout = setTimeout(hideDropdown, 100); // 延迟隐藏，给点击时间
});

function hideDropdown() {
    if (dropdown) {
        dropdown.remove();
        dropdown = null;
        hideTimeout = null;
    }
}

filterBtn.addEventListener('click', () => {
    if (filterMode) {
        filterMode = null;
        renderList();
    } else {
        // 如果没有过滤，点击时也显示dropdown
        filterBtn.dispatchEvent(new Event('mouseenter'));
    }
});

// 当切换模式时，样式按钮高亮（可选）
function refreshButtons() {
    completedBtn.textContent = viewMode === 'completed' ? '返回笔记' : '已完成';
    recycleBtn.textContent = viewMode === 'recycle' ? '返回笔记' : '回收站';
    filterBtn.textContent = filterMode ? '返回主笔记' : '按分类查找';
}

// 初始化渲染
refreshButtons();
renderList();