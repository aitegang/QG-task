// 工艺数据数组，从localStorage加载或使用默认
let processes = JSON.parse(localStorage.getItem('processes')) || [
    { name: "新工艺 3", processes: [] },
    { name: "新工艺 4", processes: [] }
];

// 当前选中的工艺索引，从localStorage加载或默认0
let currentIndex = parseInt(localStorage.getItem('currentIndex')) || 0;

// 保存数据到localStorage
function saveData() {
    localStorage.setItem('processes', JSON.stringify(processes));
    localStorage.setItem('currentIndex', currentIndex.toString());
}

// 渲染工艺列表
function renderList() {
    const list = document.getElementById('process-list');
    list.innerHTML = '';
    processes.forEach((p, i) => {
        const li = document.createElement('li');
        li.className = 'item' + (i === currentIndex ? ' active' : '');
        li.textContent = p.name;
        li.addEventListener('click', () => {
            currentIndex = i;
            renderList();
            renderDetail();
        });
        list.appendChild(li);
    });
}

// 渲染右侧工艺详情
function renderDetail() {
    const title = document.getElementById('current-process-title');
    title.textContent = '工艺：' + processes[currentIndex].name;
    const detail = document.getElementById('process-detail');
    detail.innerHTML = '';
    if (processes[currentIndex].processes.length === 0) {
        detail.innerHTML = '<div class="placeholder">将左侧工序拖拽到此处</div>';
    } else {
        const ul = document.createElement('ul');
        ul.className = 'item-list';
        processes[currentIndex].processes.forEach((proc, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${proc}</span><button class="delete-btn" data-index="${index}">删除</button>`;
            ul.appendChild(li);
        });
        detail.appendChild(ul);

        // 添加删除事件
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                processes[currentIndex].processes.splice(index, 1);
                renderDetail();
            });
        });
    }
}

// 新建工艺事件
document.getElementById('add-process-btn').addEventListener('click', () => {
    const newName = prompt('请输入新工艺名称：');
    if (newName && newName.trim()) {
        processes.push({ name: newName.trim(), processes: [] });
        currentIndex = processes.length - 1;
        renderList();
        renderDetail();
    }
});

// 删除工艺事件
document.getElementById('delete-process-btn').addEventListener('click', () => {
    if (processes.length > 1) {
        processes.splice(currentIndex, 1);
        currentIndex = Math.min(currentIndex, processes.length - 1);
        renderList();
        renderDetail();
    }
});

// 保存工艺事件
document.getElementById('save-process-btn').addEventListener('click', () => {
    saveData();
});

// 清除全部工序事件（按钮不存在，已注释）
// document.getElementById('clear-all-btn').addEventListener('click', () => {
//     processes[currentIndex].processes = [];
//     renderDetail();
// });

// 拖拽功能
// 左边工序设置为可拖拽
document.querySelectorAll('.panel-left .item-list li').forEach(li => {
    li.draggable = true;
    // 添加光标样式提示可拖拽
    li.style.cursor = 'grab';
    
    li.addEventListener('dragstart', (e) => {
        console.log('拖拽开始:', li.textContent);
        e.dataTransfer.setData('text/plain', li.textContent);
        // 视觉反馈：改变背景色
        li.style.opacity = '0.6';
    });
    
    li.addEventListener('dragend', () => {
        console.log('拖拽结束');
        li.style.opacity = '1';
    });
});

// 右边工艺编辑区接受拖拽
const processDetail = document.getElementById('process-detail');
processDetail.addEventListener('dragover', (e) => {
    e.preventDefault();
    // 视觉反馈：改变边框颜色
    processDetail.style.border = '2px dashed #2f6cff';
});

processDetail.addEventListener('dragleave', () => {
    // 恢复边框
    processDetail.style.border = '';
});

processDetail.addEventListener('drop', (e) => {
    e.preventDefault();
    processDetail.style.border = '';
    const processName = e.dataTransfer.getData('text/plain');
    console.log('拖放接收:', processName);
    if (processName) {
        processes[currentIndex].processes.push(processName);
        renderDetail();
    }
});

// 初始渲染
renderList();
renderDetail();