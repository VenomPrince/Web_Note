document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const textArea = document.getElementById('textArea');
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const tabBar = document.getElementById('tabBar');
    const tabContent = document.getElementById('tabContent');
    const suggestionBox = document.getElementById('suggestionBox');

    // Mode controls
    const textMode = document.getElementById('textMode');
    const drawMode = document.getElementById('drawMode');

    // Text controls
    const fontFamily = document.getElementById('fontFamily');
    const fontSize = document.getElementById('fontSize');
    const textColor = document.getElementById('textColor');
    const boldBtn = document.getElementById('bold');
    const italicBtn = document.getElementById('italic');
    const underlineBtn = document.getElementById('underline');

    // Drawing controls
    const drawColor = document.getElementById('drawColor');
    const brushSize = document.getElementById('brushSize');
    const clearCanvas = document.getElementById('clearCanvas');

    // File controls
    const newPageBtn = document.getElementById('newPage');
    const saveNoteBtn = document.getElementById('saveNote');
    const exportBtn = document.getElementById('exportBtn');
    const exportContent = document.querySelector('.export-content');
    const saveIndicator = document.getElementById('saveIndicator');

    // Tab management
    let tabs = [];
    let activeTabId = null;

    class Tab {
        constructor() {
            this.id = Date.now().toString();
            this.title = `Note ${tabs.length + 1}`;
            this.textContent = '';
            this.canvasData = '';
            this.createTab();
            this.makeTabNameEditable();
        }

        createTab() {
            const tab = document.createElement('button');
            tab.className = 'tab';
            tab.dataset.id = this.id;
            tab.innerHTML = `
                <i class="fas fa-file-alt"></i>
                <span>${this.title}</span>
                <span class="close-tab"><i class="fas fa-times"></i></span>
            `;

            tab.addEventListener('click', (e) => {
                if (!e.target.closest('.close-tab')) {
                    this.activate();
                }
            });

            tab.querySelector('.close-tab').addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });

            this.tabButton = tab;
            tabBar.appendChild(tab);
        }

        activate() {
            // Save current tab content if exists
            if (activeTabId) {
                const currentTab = tabs.find(t => t.id === activeTabId);
                if (currentTab) {
                    currentTab.save();
                }
            }

            // Deactivate all tabs
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            
            // Activate this tab
            this.tabButton.classList.add('active');
            activeTabId = this.id;
            
            // Load content
            textArea.innerHTML = this.textContent;
            
            // Load canvas if there's data
            if (this.canvasData) {
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                };
                img.src = this.canvasData;
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        save() {
            this.textContent = textArea.innerHTML;
            this.canvasData = canvas.toDataURL();
        }

        close() {
            const index = tabs.findIndex(t => t.id === this.id);
            if (index !== -1) {
                this.save();
                tabs.splice(index, 1);
                this.tabButton.remove();
                
                if (this.id === activeTabId) {
                    if (tabs.length > 0) {
                        const newActiveTab = tabs[Math.max(0, index - 1)];
                        newActiveTab.activate();
                    } else {
                        createNewTab();
                    }
                }
            }
        }

        makeTabNameEditable() {
            const titleSpan = this.tabButton.querySelector('span');
            titleSpan.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                const input = document.createElement('input');
                input.value = this.title;
                input.className = 'tab-name-input';
                
                input.addEventListener('blur', () => {
                    this.title = input.value;
                    titleSpan.textContent = input.value;
                    saveToLocalStorage();
                });

                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        input.blur();
                    }
                });

                titleSpan.textContent = '';
                titleSpan.appendChild(input);
                input.focus();
            });
        }
    }

    function createNewTab() {
        if (activeTabId) {
            const currentTab = tabs.find(t => t.id === activeTabId);
            if (currentTab) {
                currentTab.save();
            }
        }

        const tab = new Tab();
        tabs.push(tab);
        tab.activate();
        return tab;
    }

    // Canvas setup
    function resizeCanvas() {
        canvas.width = textArea.offsetWidth;
        canvas.height = textArea.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mode switching
    textMode.addEventListener('click', () => {
        textMode.classList.add('active');
        drawMode.classList.remove('active');
        canvas.style.display = 'none';
        textArea.style.display = 'block';
    });

    drawMode.addEventListener('click', () => {
        drawMode.classList.add('active');
        textMode.classList.remove('active');
        canvas.style.display = 'block';
        textArea.style.display = 'none';
    });

    // Text formatting controls
    fontFamily.addEventListener('change', () => {
        document.execCommand('fontName', false, fontFamily.value);
    });

    fontSize.addEventListener('change', () => {
        document.execCommand('fontSize', false, fontSize.value);
    });

    textColor.addEventListener('input', () => {
        document.execCommand('foreColor', false, textColor.value);
    });

    boldBtn.addEventListener('click', () => {
        document.execCommand('bold', false);
    });

    italicBtn.addEventListener('click', () => {
        document.execCommand('italic', false);
    });

    underlineBtn.addEventListener('click', () => {
        document.execCommand('underline', false);
    });

    // Drawing functionality
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    function draw(e) {
        if (!isDrawing) return;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.strokeStyle = drawColor.value;
        ctx.lineWidth = brushSize.value;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });

    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    clearCanvas.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // New page button
    newPageBtn.addEventListener('click', createNewTab);

    // Define commands
    const commands = [
        {
            name: 'color',
            description: 'Change text color',
            subcommands: [
                { name: 'red', action: () => document.execCommand('foreColor', false, '#ff0000') },
                { name: 'blue', action: () => document.execCommand('foreColor', false, '#0000ff') },
                { name: 'green', action: () => document.execCommand('foreColor', false, '#00ff00') },
                { name: 'black', action: () => document.execCommand('foreColor', false, '#000000') },
                { name: 'white', action: () => document.execCommand('foreColor', false, '#ffffff') }
            ]
        },
        {
            name: 'highlight',
            description: 'Highlight text',
            subcommands: [
                { name: 'yellow', action: () => document.execCommand('backColor', false, '#ffff00') },
                { name: 'green', action: () => document.execCommand('backColor', false, '#90EE90') },
                { name: 'blue', action: () => document.execCommand('backColor', false, '#87CEEB') },
                { name: 'pink', action: () => document.execCommand('backColor', false, '#FFB6C1') }
            ]
        },
        {
            name: 'h',
            description: 'Add heading',
            subcommands: [
                { name: '1', action: () => document.execCommand('formatBlock', false, '<h1>') },
                { name: '2', action: () => document.execCommand('formatBlock', false, '<h2>') },
                { name: '3', action: () => document.execCommand('formatBlock', false, '<h3>') },
                { name: '4', action: () => document.execCommand('formatBlock', false, '<h4>') },
                { name: '5', action: () => document.execCommand('formatBlock', false, '<h5>') }
            ]
        },
        {
            name: 'bold',
            description: 'Make text bold',
            action: () => document.execCommand('bold', false, null)
        },
        {
            name: 'italic',
            description: 'Make text italic',
            action: () => document.execCommand('italic', false, null)
        },
        {
            name: 'underline',
            description: 'Underline text',
            action: () => document.execCommand('underline', false, null)
        },
        {
            name: 'strike',
            description: 'Strike through text',
            action: () => document.execCommand('strikeThrough', false, null)
        },
        {
            name: 'bullet',
            description: 'Create bullet list',
            action: () => document.execCommand('insertUnorderedList', false, null)
        },
        {
            name: 'number',
            description: 'Create numbered list',
            action: () => document.execCommand('insertOrderedList', false, null)
        },
        {
            name: 'clear',
            description: 'Clear formatting',
            action: () => {
                document.execCommand('removeFormat', false, null);
                document.execCommand('formatBlock', false, 'div');
            }
        }
    ];

    let currentSuggestions = [];
    let selectedIndex = -1;

    // Handle commands in text area
    textArea.addEventListener('input', (e) => {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const node = range.startContainer;
        
        if (node.nodeType === 3) {
            const text = node.textContent;
            const position = range.startOffset;
            const lastSlash = text.lastIndexOf('/', position);
            
            if (lastSlash !== -1) {
                const query = text.slice(lastSlash + 1, position).toLowerCase();
                const parts = query.split(' ');
                
                if (parts.length === 1) {
                    currentSuggestions = commands.filter(cmd => 
                        cmd.name.toLowerCase().startsWith(parts[0]) || 
                        cmd.description.toLowerCase().includes(parts[0])
                        .map(cmd => ({
                            name: cmd.name,
                            description: cmd.description,
                            action: cmd.action
                        })));
                } else if (parts.length === 2) {
                    const mainCommand = commands.find(cmd => cmd.name === parts[0]);
                    if (mainCommand && mainCommand.subcommands) {
                        currentSuggestions = mainCommand.subcommands
                            .filter(sub => sub.name.toLowerCase().startsWith(parts[1]))
                            .map(sub => ({
                                name: `${mainCommand.name} ${sub.name}`,
                                description: mainCommand.description,
                                action: sub.action
                            }));
                    }
                }

                if (currentSuggestions.length > 0) {
                    selectedIndex = 0;
                    updateSuggestionBox(range);
                } else {
                    suggestionBox.style.display = 'none';
                }
            } else {
                suggestionBox.style.display = 'none';
            }
        }
    });

    function updateSuggestionBox(range) {
        const rect = range.getBoundingClientRect();
        suggestionBox.style.left = `${rect.left}px`;
        suggestionBox.style.top = `${rect.bottom + window.scrollY + 5}px`;
        
        suggestionBox.innerHTML = currentSuggestions.map((cmd, index) => `
            <div class="suggestion ${index === selectedIndex ? 'selected' : ''}" 
                 data-index="${index}">
                <span class="command-name">${cmd.name}</span>
                <span class="suggestion-description">${cmd.description || ''}</span>
            </div>
        `).join('');
        
        suggestionBox.style.display = 'block';
        
        suggestionBox.querySelectorAll('.suggestion').forEach((el, index) => {
            el.addEventListener('click', () => {
                executeCommand(currentSuggestions[index]);
            });
            
            el.addEventListener('mouseenter', () => {
                selectedIndex = parseInt(el.dataset.index);
                updateSelectedSuggestion();
            });
        });
    }

    function updateSelectedSuggestion() {
        suggestionBox.querySelectorAll('.suggestion').forEach((el, index) => {
            el.classList.toggle('selected', index === selectedIndex);
        });
    }

    textArea.addEventListener('keydown', (e) => {
        if (suggestionBox.style.display === 'block') {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, currentSuggestions.length - 1);
                    updateSelectedSuggestion();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, 0);
                    updateSelectedSuggestion();
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (selectedIndex >= 0) {
                        executeCommand(currentSuggestions[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    suggestionBox.style.display = 'none';
                    break;
            }
        }
    });

    function executeCommand(command) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const node = range.startContainer;
        const text = node.textContent;
        const lastSlash = text.lastIndexOf('/');
        
        node.textContent = text.slice(0, lastSlash);
        
        const newRange = document.createRange();
        newRange.setStart(node, node.textContent.length);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        if (typeof command.action === 'function') {
            command.action();
        }
        
        document.execCommand('insertText', false, ' ');
        suggestionBox.style.display = 'none';
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#suggestionBox') && !e.target.closest('#textArea')) {
            suggestionBox.style.display = 'none';
        }
    });

    // Save functionality
    function saveToLocalStorage() {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
            currentTab.save();
            const savedTabs = tabs.map(tab => ({
                id: tab.id,
                title: tab.title,
                textContent: tab.textContent,
                canvasData: tab.canvasData
            }));
            localStorage.setItem('webNotesTabs', JSON.stringify(savedTabs));
            localStorage.setItem('webNotesActiveTab', activeTabId);
            showSaveIndicator();
        }
    }

    function loadFromLocalStorage() {
        const savedTabs = JSON.parse(localStorage.getItem('webNotesTabs') || '[]');
        const savedActiveTab = localStorage.getItem('webNotesActiveTab');

        if (savedTabs.length > 0) {
            tabs.forEach(tab => tab.tabButton.remove());
            tabs = [];

            savedTabs.forEach(savedTab => {
                const tab = new Tab();
                tab.id = savedTab.id;
                tab.title = savedTab.title;
                tab.textContent = savedTab.textContent;
                tab.canvasData = savedTab.canvasData;
                tabs.push(tab);
            });

            const tabToActivate = tabs.find(t => t.id === savedActiveTab) || tabs[0];
            tabToActivate.activate();
        } else {
            createNewTab();
        }
    }

    function showSaveIndicator() {
        saveIndicator.style.display = 'block';
        setTimeout(() => {
            saveIndicator.style.display = 'none';
        }, 2000);
    }

    // Auto-save every 30 seconds
    setInterval(saveToLocalStorage, 30000);

    // Export dropdown behavior
    let isExportMenuOpen = false;

    exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isExportMenuOpen = !isExportMenuOpen;
        exportContent.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!exportContent.contains(e.target) && !exportBtn.contains(e.target)) {
            isExportMenuOpen = false;
            exportContent.classList.remove('show');
        }
    });

    // Basic export functionality
    saveNoteBtn.addEventListener('click', () => {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
            currentTab.save();
            const content = textArea.innerHTML;
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentTab.title}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showSaveIndicator();
        }
    });

    // Load saved notes on startup
    loadFromLocalStorage();
});