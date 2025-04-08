document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const textArea = document.getElementById('textArea');
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const commandInput = document.getElementById('commandInput');
    const commandSuggestions = document.getElementById('commandSuggestions');
    const tabBar = document.getElementById('tabBar');
    const tabContent = document.getElementById('tabContent');

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

    // New elements
    const newPageBtn = document.getElementById('newPage');
    const saveNoteBtn = document.getElementById('saveNote');
    const exportPDFBtn = document.getElementById('exportPDF');
    const exportImageBtn = document.getElementById('exportImage');
    const historyBtn = document.getElementById('historyBtn');
    const historyModal = document.getElementById('historyModal');
    const closeModal = document.querySelector('.close');
    const historyList = document.getElementById('historyList');
    const saveIndicator = document.getElementById('saveIndicator');
    const exportAllBtn = document.getElementById('exportAll');

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
            makeTabNameEditable(this);
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
                // Save content before closing
                this.save();
                
                tabs.splice(index, 1);
                this.tabButton.remove();
                
                // If this was the active tab, activate another one
                if (this.id === activeTabId) {
                    if (tabs.length > 0) {
                        // Activate the previous tab, or the first one if this was the first tab
                        const newActiveTab = tabs[Math.max(0, index - 1)];
                        newActiveTab.activate();
                    } else {
                        // If no tabs left, create a new one
                        createNewTab();
                    }
                }
            }
        }
    }

    function createNewTab() {
        // Save current tab content if exists
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
            name: 'end',
            description: 'Clear formatting',
            action: () => {
                document.execCommand('removeFormat', false, null);
                document.execCommand('formatBlock', false, 'div');
            }
        }
    ];

    let currentSuggestions = [];
    let selectedIndex = -1;
    const suggestionBox = document.getElementById('suggestionBox');

    // Handle commands in text area
    textArea.addEventListener('input', (e) => {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const node = range.startContainer;
        
        if (node.nodeType === 3) { // Text node
            const text = node.textContent;
            const position = range.startOffset;
            
            // Find the last '/' before cursor
            const lastSlash = text.lastIndexOf('/', position);
            if (lastSlash !== -1) {
                const query = text.slice(lastSlash + 1, position).toLowerCase();
                const parts = query.split(' ');
                
                if (parts.length === 1) {
                    // Main command suggestions
                    currentSuggestions = commands.filter(cmd => 
                        cmd.name.toLowerCase().startsWith(parts[0]) || 
                        cmd.description.toLowerCase().includes(parts[0])
                    );
                } else if (parts.length === 2) {
                    // Subcommand suggestions
                    const mainCommand = commands.find(cmd => cmd.name === parts[0]);
                    if (mainCommand && mainCommand.subcommands) {
                        currentSuggestions = mainCommand.subcommands
                            .filter(sub => sub.name.toLowerCase().startsWith(parts[1]))
                            .map(sub => ({
                                name: `${mainCommand.name} ${sub.name}`,
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
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const boxHeight = 320;
        const boxWidth = 280;
        
        // Calculate horizontal position - try to center relative to cursor
        let leftPos = rect.left + window.scrollX - (boxWidth / 2);
        
        // Keep box within screen bounds horizontally
        if (leftPos < 20) {
            leftPos = 20; // 20px buffer from left edge
        } else if (leftPos + boxWidth > windowWidth - 20) {
            leftPos = windowWidth - boxWidth - 20; // 20px buffer from right edge
        }
        
        // Calculate vertical position - prefer above cursor unless near top of screen
        let topPos;
        const spaceAbove = rect.top;
        const spaceBelow = windowHeight - rect.bottom;
        
        if (spaceBelow < boxHeight + 50) { // If less than boxHeight + 50px below
            // Position above, but ensure it doesn't go off-screen top
            topPos = Math.max(20, rect.top + window.scrollY - boxHeight - 10);
        } else {
            // Position below but higher up than before
            topPos = rect.bottom + window.scrollY - 200; // Lift it up by 200px
        }
        
        // Apply positions
        suggestionBox.style.left = `${leftPos}px`;
        suggestionBox.style.top = `${topPos}px`;
        
        // Group commands by type
        const mainCommands = currentSuggestions.filter(cmd => !cmd.name.includes(' '));
        const subCommands = currentSuggestions.filter(cmd => cmd.name.includes(' '));
        
        const suggestions = [...mainCommands, ...subCommands].map((cmd, index) => `
            <div class="suggestion ${index === selectedIndex ? 'selected' : ''}" 
                 data-index="${index}">
                <span class="command-name">${cmd.name}</span>
                <span class="suggestion-description">${cmd.description || ''}</span>
            </div>
        `).join('');
        
        suggestionBox.innerHTML = `
            <div class="suggestions-container">
                ${suggestions}
            </div>
        `;
        
        suggestionBox.style.display = 'block';
        
        // Add click handlers
        suggestionBox.querySelectorAll('.suggestion').forEach((el, index) => {
            el.addEventListener('click', () => {
                executeCommand(currentSuggestions[index]);
            });
            
            // Add hover effect
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

    // Handle keyboard navigation
    textArea.addEventListener('keydown', (e) => {
        if (suggestionBox.style.display === 'block') {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, currentSuggestions.length - 1);
                    updateSuggestionBox(window.getSelection().getRangeAt(0));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, 0);
                    updateSuggestionBox(window.getSelection().getRangeAt(0));
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

    // Handle suggestion clicks
    suggestionBox.addEventListener('click', (e) => {
        const suggestion = e.target.closest('.suggestion');
        if (suggestion) {
            const index = parseInt(suggestion.dataset.index);
            executeCommand(currentSuggestions[index]);
        }
    });

    function executeCommand(command) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const node = range.startContainer;
        const text = node.textContent;
        const lastSlash = text.lastIndexOf('/');
        
        // Save the current selection
        const savedRange = range.cloneRange();
        
        // Remove the command text
        node.textContent = text.slice(0, lastSlash);
        
        // Restore selection at the end of the remaining text
        const newRange = document.createRange();
        newRange.setStart(node, node.textContent.length);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        // Execute the command
        if (typeof command.action === 'function') {
            command.action();
        } else if (command.subcommands) {
            const subcommand = command.subcommands[0];
            if (subcommand && subcommand.action) {
                subcommand.action();
            }
        }
        
        // Insert a space after the command
        document.execCommand('insertText', false, ' ');
        
        suggestionBox.style.display = 'none';
    }

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#suggestionBox') && !e.target.closest('#textArea')) {
            suggestionBox.style.display = 'none';
        }
    });

    // Save functionality with local storage
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

    // Load from local storage
    function loadFromLocalStorage() {
        const savedTabs = JSON.parse(localStorage.getItem('webNotesTabs') || '[]');
        const savedActiveTab = localStorage.getItem('webNotesActiveTab');

        if (savedTabs.length > 0) {
            // Clear existing tabs
            tabs.forEach(tab => tab.tabButton.remove());
            tabs = [];

            // Restore saved tabs
            savedTabs.forEach(savedTab => {
                const tab = new Tab();
                tab.id = savedTab.id;
                tab.title = savedTab.title;
                tab.textContent = savedTab.textContent;
                tab.canvasData = savedTab.canvasData;
                tabs.push(tab);
            });

            // Activate the previously active tab
            const tabToActivate = tabs.find(t => t.id === savedActiveTab) || tabs[0];
            tabToActivate.activate();
        } else {
            createNewTab();
        }
    }

    // Make tab names editable
    function makeTabNameEditable(tab) {
        const titleSpan = tab.tabButton.querySelector('span');
        titleSpan.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const input = document.createElement('input');
            input.value = tab.title;
            input.className = 'tab-name-input';
            
            input.addEventListener('blur', () => {
                tab.title = input.value;
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

    // Auto-save every 60 seconds
    setInterval(saveToLocalStorage, 60000);

    // Save when switching tabs
    function switchTab(newTab) {
        saveToLocalStorage();
        newTab.activate();
    }

    // Load saved notes on startup
    loadFromLocalStorage();

    // Create initial tab
    createNewTab();

    // Save and export functionality
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

    async function exportAsPDF(content, filename, options = {}) {
        const { textOnly = false, drawingOnly = false } = options;
        const pdf = new jsPDF();
        let currentY = 10;

        try {
            if (!drawingOnly) {
                // Export text content
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content.textContent;
                tempDiv.style.width = '800px';
                tempDiv.style.padding = '20px';
                tempDiv.style.background = '#fff';
                tempDiv.style.color = '#000';
                document.body.appendChild(tempDiv);

                const textCanvas = await html2canvas(tempDiv);
                const textImgData = textCanvas.toDataURL('image/jpeg', 1.0);
                
                const contentWidth = pdf.internal.pageSize.getWidth() - 20;
                const contentHeight = (textCanvas.height * contentWidth) / textCanvas.width;
                
                pdf.addImage(textImgData, 'JPEG', 10, currentY, contentWidth, contentHeight);
                currentY += contentHeight + 10;

                document.body.removeChild(tempDiv);
            }

            if (!textOnly && content.canvasData && !isCanvasEmpty(content.canvasData)) {
                // Add new page if needed
                if (!drawingOnly && currentY + 200 > pdf.internal.pageSize.getHeight()) {
                    pdf.addPage();
                    currentY = 10;
                }

                const drawingImgData = content.canvasData.toDataURL('image/png');
                const contentWidth = pdf.internal.pageSize.getWidth() - 20;
                pdf.addImage(drawingImgData, 'PNG', 10, currentY, contentWidth, 200);
            }

            pdf.save(filename);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error exporting PDF. Please try again.');
        }
    }

    async function exportAsImage(content, filename, options = {}) {
        const { textOnly = false, drawingOnly = false } = options;
        
        try {
            if (drawingOnly && content.canvasData) {
                // Export only drawing
                const dataUrl = content.canvasData.toDataURL('image/png');
                downloadURL(dataUrl, filename);
            } else if (textOnly) {
                // Export only text
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content.textContent;
                tempDiv.style.width = '800px';
                tempDiv.style.padding = '20px';
                tempDiv.style.background = '#fff';
                tempDiv.style.color = '#000';
                document.body.appendChild(tempDiv);

                const canvas = await html2canvas(tempDiv);
                const dataUrl = canvas.toDataURL('image/png');
                downloadURL(dataUrl, filename);

                document.body.removeChild(tempDiv);
            } else {
                // Export both
                const container = document.createElement('div');
                container.style.width = '800px';
                container.style.background = '#fff';
                container.style.padding = '20px';

                const textDiv = document.createElement('div');
                textDiv.innerHTML = content.textContent;
                container.appendChild(textDiv);

                if (content.canvasData && !isCanvasEmpty(content.canvasData)) {
                    const drawingImg = document.createElement('img');
                    drawingImg.src = content.canvasData.toDataURL('image/png');
                    drawingImg.style.width = '100%';
                    drawingImg.style.marginTop = '20px';
                    container.appendChild(drawingImg);
                }

                document.body.appendChild(container);
                const canvas = await html2canvas(container);
                const dataUrl = canvas.toDataURL('image/png');
                downloadURL(dataUrl, filename);
                document.body.removeChild(container);
            }
        } catch (error) {
            console.error('Error exporting image:', error);
            alert('Error exporting image. Please try again.');
        }
    }

    // Export button event listeners
    document.getElementById('exportPDF').addEventListener('click', () => {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
            exportAsPDF(currentTab, `${currentTab.title}.pdf`);
        }
    });

    document.getElementById('exportPDFText').addEventListener('click', () => {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
            exportAsPDF(currentTab, `${currentTab.title}_text.pdf`, { textOnly: true });
        }
    });

    document.getElementById('exportPDFDrawing').addEventListener('click', () => {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
            exportAsPDF(currentTab, `${currentTab.title}_drawing.pdf`, { drawingOnly: true });
        }
    });

    document.getElementById('exportImage').addEventListener('click', () => {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
            exportAsImage(currentTab, `${currentTab.title}.png`);
        }
    });

    document.getElementById('exportImageText').addEventListener('click', () => {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
            exportAsImage(currentTab, `${currentTab.title}_text.png`, { textOnly: true });
        }
    });

    document.getElementById('exportImageDrawing').addEventListener('click', () => {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
            exportAsImage(currentTab, `${currentTab.title}_drawing.png`, { drawingOnly: true });
        }
    });

    document.getElementById('exportHTML').addEventListener('click', () => {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
            const content = `
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; }
                        img { max-width: 100%; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <h1>${currentTab.title}</h1>
                    ${currentTab.textContent}
                    ${currentTab.canvasData && !isCanvasEmpty(currentTab.canvasData) ? 
                        `<img src="${currentTab.canvasData.toDataURL()}" alt="Drawing">` : ''}
                </body>
                </html>
            `;
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentTab.title}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    });

    // Export all buttons
    document.getElementById('exportAllPDF').addEventListener('click', async () => {
        const pdf = new jsPDF();
        let currentY = 10;

        for (const tab of tabs) {
            pdf.setFontSize(16);
            pdf.text(tab.title, 10, currentY);
            currentY += 15;

            if (!isCanvasEmpty(tab.canvasData)) {
                const contentWidth = pdf.internal.pageSize.getWidth() - 20;
                
                // Add text content
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = tab.textContent;
                tempDiv.style.width = '800px';
                tempDiv.style.padding = '20px';
                tempDiv.style.background = '#fff';
                tempDiv.style.color = '#000';
                document.body.appendChild(tempDiv);

                const textCanvas = await html2canvas(tempDiv);
                const textImgData = textCanvas.toDataURL('image/jpeg', 1.0);
                const textHeight = (textCanvas.height * contentWidth) / textCanvas.width;

                if (currentY + textHeight > pdf.internal.pageSize.getHeight()) {
                    pdf.addPage();
                    currentY = 10;
                }

                pdf.addImage(textImgData, 'JPEG', 10, currentY, contentWidth, textHeight);
                currentY += textHeight + 10;

                document.body.removeChild(tempDiv);

                // Add drawing if exists
                if (currentY + 200 > pdf.internal.pageSize.getHeight()) {
                    pdf.addPage();
                    currentY = 10;
                }

                const drawingImgData = tab.canvasData.toDataURL('image/png');
                pdf.addImage(drawingImgData, 'PNG', 10, currentY, contentWidth, 200);
                currentY += 210;
            }

            if (currentY > pdf.internal.pageSize.getHeight() - 30) {
                pdf.addPage();
                currentY = 10;
            }
        }

        pdf.save('all_notes.pdf');
    });

    document.getElementById('exportAllPDFText').addEventListener('click', async () => {
        const pdf = new jsPDF();
        let currentY = 10;

        for (const tab of tabs) {
            pdf.setFontSize(16);
            pdf.text(tab.title, 10, currentY);
            currentY += 15;

            const contentWidth = pdf.internal.pageSize.getWidth() - 20;
            
            // Add text content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = tab.textContent;
            tempDiv.style.width = '800px';
            tempDiv.style.padding = '20px';
            tempDiv.style.background = '#fff';
            tempDiv.style.color = '#000';
            document.body.appendChild(tempDiv);

            const textCanvas = await html2canvas(tempDiv);
            const textImgData = textCanvas.toDataURL('image/jpeg', 1.0);
            const textHeight = (textCanvas.height * contentWidth) / textCanvas.width;

            if (currentY + textHeight > pdf.internal.pageSize.getHeight()) {
                pdf.addPage();
                currentY = 10;
            }

            pdf.addImage(textImgData, 'JPEG', 10, currentY, contentWidth, textHeight);
            currentY += textHeight + 20;

            document.body.removeChild(tempDiv);

            if (currentY > pdf.internal.pageSize.getHeight() - 30) {
                pdf.addPage();
                currentY = 10;
            }
        }

        pdf.save('all_notes_text.pdf');
    });

    document.getElementById('exportAllPDFDrawing').addEventListener('click', async () => {
        const pdf = new jsPDF();
        let currentY = 10;

        for (const tab of tabs) {
            if (tab.canvasData && !isCanvasEmpty(tab.canvasData)) {
                pdf.setFontSize(16);
                pdf.text(tab.title, 10, currentY);
                currentY += 15;

                const contentWidth = pdf.internal.pageSize.getWidth() - 20;

                if (currentY + 200 > pdf.internal.pageSize.getHeight()) {
                    pdf.addPage();
                    currentY = 10;
                }

                const drawingImgData = tab.canvasData.toDataURL('image/png');
                pdf.addImage(drawingImgData, 'PNG', 10, currentY, contentWidth, 200);
                currentY += 210;

                if (currentY > pdf.internal.pageSize.getHeight() - 30) {
                    pdf.addPage();
                    currentY = 10;
                }
            }
        }

        pdf.save('all_notes_drawing.pdf');
    });

    document.getElementById('exportAllZip').addEventListener('click', async () => {
        const zip = new JSZip();
        
        // Create folders
        const pdfFolder = zip.folder('pdf');
        const imageFolder = zip.folder('images');
        const htmlFolder = zip.folder('html');
        
        for (const tab of tabs) {
            // Save as HTML
            const htmlContent = `
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; }
                        img { max-width: 100%; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <h1>${tab.title}</h1>
                    ${tab.textContent}
                    ${tab.canvasData && !isCanvasEmpty(tab.canvasData) ? 
                        `<img src="${tab.canvasData.toDataURL()}" alt="Drawing">` : ''}
                </body>
                </html>
            `;
            htmlFolder.file(`${tab.title}.html`, htmlContent);

            // Save text as image
            const textDiv = document.createElement('div');
            textDiv.innerHTML = tab.textContent;
            textDiv.style.width = '800px';
            textDiv.style.padding = '20px';
            textDiv.style.background = '#fff';
            textDiv.style.color = '#000';
            document.body.appendChild(textDiv);
            
            const textCanvas = await html2canvas(textDiv);
            const textImage = textCanvas.toDataURL('image/png').split('base64,')[1];
            imageFolder.file(`${tab.title}_text.png`, textImage, {base64: true});
            
            document.body.removeChild(textDiv);

            // Save drawing if exists
            if (tab.canvasData && !isCanvasEmpty(tab.canvasData)) {
                const drawingImage = tab.canvasData.toDataURL('image/png').split('base64,')[1];
                imageFolder.file(`${tab.title}_drawing.png`, drawingImage, {base64: true});
            }

            // Create individual PDFs
            const pdfAll = new jsPDF();
            await exportAsPDF(tab, `${tab.title}.pdf`);
            pdfFolder.file(`${tab.title}.pdf`, await pdfAll.output('blob'));

            const pdfText = new jsPDF();
            await exportAsPDF(tab, `${tab.title}_text.pdf`, { textOnly: true });
            pdfFolder.file(`${tab.title}_text.pdf`, await pdfText.output('blob'));

            if (tab.canvasData && !isCanvasEmpty(tab.canvasData)) {
                const pdfDrawing = new jsPDF();
                await exportAsPDF(tab, `${tab.title}_drawing.pdf`, { drawingOnly: true });
                pdfFolder.file(`${tab.title}_drawing.pdf`, await pdfDrawing.output('blob'));
            }
        }

        // Generate and download zip
        const content = await zip.generateAsync({type: 'blob'});
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'all_notes.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    function downloadURL(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function isCanvasEmpty(canvas) {
        const context = canvas.getContext('2d');
        const pixelBuffer = new Uint32Array(
            context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
        );
        return !pixelBuffer.some(color => color !== 0);
    }

    // Export dropdown behavior
    const exportBtn = document.getElementById('exportBtn');
    const exportContent = document.querySelector('.export-content');
    let isExportMenuOpen = false;

    exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isExportMenuOpen = !isExportMenuOpen;
        exportContent.classList.toggle('show');
    });

    exportContent.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    document.addEventListener('click', (e) => {
        if (!exportContent.contains(e.target) && !exportBtn.contains(e.target)) {
            isExportMenuOpen = false;
            exportContent.classList.remove('show');
        }
    });

    // Keep menu open when hovering
    exportContent.addEventListener('mouseenter', () => {
        if (isExportMenuOpen) {
            exportContent.classList.add('show');
        }
    });

    exportContent.addEventListener('mouseleave', (e) => {
        // Check if we're moving to the export button
        const rect = exportBtn.getBoundingClientRect();
        if (!(e.clientX >= rect.left && e.clientX <= rect.right && 
              e.clientY >= rect.top && e.clientY <= rect.bottom)) {
            isExportMenuOpen = false;
            exportContent.classList.remove('show');
        }
    });
});
