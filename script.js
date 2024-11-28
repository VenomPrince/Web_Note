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
        suggestionBox.style.top = `${rect.bottom + window.scrollY + 5}px`;
        suggestionBox.style.left = `${rect.left + window.scrollX}px`;
        
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

    async function exportNoteAsPDF(tab, pdf, startY) {
        let currentY = startY;
        
        // Add title
        pdf.setFontSize(16);
        pdf.text(tab.title, 10, currentY);
        currentY += 15;
        
        // Create temporary div for text content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = tab.textContent;
        tempDiv.style.width = '800px';
        tempDiv.style.padding = '20px';
        tempDiv.style.background = '#fff';
        tempDiv.style.color = '#000';
        document.body.appendChild(tempDiv);
        
        try {
            // Convert text content to image
            const textCanvas = await html2canvas(tempDiv);
            const textImgData = textCanvas.toDataURL('image/jpeg', 1.0);
            
            // Calculate dimensions for text content
            const pageWidth = pdf.internal.pageSize.getWidth();
            const contentWidth = pageWidth - 20;
            const contentHeight = (textCanvas.height * contentWidth) / textCanvas.width;
            
            // Add new page if needed
            if (currentY + contentHeight > pdf.internal.pageSize.getHeight()) {
                pdf.addPage();
                currentY = 10;
            }
            
            // Add text content
            pdf.addImage(textImgData, 'JPEG', 10, currentY, contentWidth, contentHeight);
            currentY += contentHeight + 10;
            
            // Add drawing if it exists
            if (tab.canvasData && !isCanvasEmpty(tab.canvasData)) {
                // Add new page if needed
                if (currentY + 200 > pdf.internal.pageSize.getHeight()) {
                    pdf.addPage();
                    currentY = 10;
                }
                
                const drawingImgData = tab.canvasData.toDataURL('image/png');
                pdf.addImage(drawingImgData, 'PNG', 10, currentY, contentWidth, 200);
                currentY += 210;
            }
            
        } finally {
            document.body.removeChild(tempDiv);
        }
        
        return currentY;
    }

    exportPDFBtn.addEventListener('click', async () => {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
            try {
                // Create a temporary container with proper styling
                const tempContainer = document.createElement('div');
                tempContainer.innerHTML = textArea.innerHTML;
                tempContainer.style.width = '800px';
                tempContainer.style.padding = '40px';
                tempContainer.style.background = '#fff';
                tempContainer.style.color = '#000';
                document.body.appendChild(tempContainer);

                // Convert to canvas
                const canvas = await html2canvas(tempContainer, {
                    scale: 2,
                    backgroundColor: '#fff',
                    logging: false,
                    useCORS: true
                });

                // Create PDF
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px'
                });

                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`${currentTab.title}.pdf`);

                // Clean up
                document.body.removeChild(tempContainer);
            } catch (error) {
                console.error('Error exporting PDF:', error);
                alert('Error exporting PDF. Please try again.');
            }
        }
    });

    exportImageBtn.addEventListener('click', async () => {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
            try {
                if (drawMode.classList.contains('active')) {
                    // Export canvas
                    const dataUrl = canvas.toDataURL('image/png');
                    downloadURL(dataUrl, `${currentTab.title}.png`);
                } else {
                    // Export text content
                    const tempContainer = document.createElement('div');
                    tempContainer.innerHTML = textArea.innerHTML;
                    tempContainer.style.width = '800px';
                    tempContainer.style.padding = '40px';
                    tempContainer.style.background = '#fff';
                    tempContainer.style.color = '#000';
                    document.body.appendChild(tempContainer);

                    const canvas = await html2canvas(tempContainer, {
                        scale: 2,
                        backgroundColor: '#fff',
                        logging: false,
                        useCORS: true
                    });

                    const dataUrl = canvas.toDataURL('image/png');
                    downloadURL(dataUrl, `${currentTab.title}.png`);

                    document.body.removeChild(tempContainer);
                }
            } catch (error) {
                console.error('Error exporting image:', error);
                alert('Error exporting image. Please try again.');
            }
        }
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

    exportAllBtn.addEventListener('click', async () => {
        const allTabs = tabs;
        const zip = new JSZip();
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        let currentY = 10;
        
        // Create folders in zip
        const htmlFolder = zip.folder("html");
        const pdfFolder = zip.folder("pdf");
        const imagesFolder = zip.folder("images");
        
        // Process each tab
        for (let i = 0; i < allTabs.length; i++) {
            const tab = allTabs[i];
            
            // Save as HTML
            const combinedHTML = `
                <html>
                <body>
                    <h1>${tab.title}</h1>
                    <div class="text-content">
                        ${tab.textContent}
                    </div>
                    ${tab.canvasData && !isCanvasEmpty(tab.canvasData) ? 
                        `<div class="drawing">
                            <img src="${tab.canvasData.toDataURL()}" />
                        </div>` : ''}
                </body>
                </html>
            `;
            htmlFolder.file(`${tab.title}.html`, combinedHTML);
            
            // Add to combined PDF
            if (i > 0 && currentY > pdf.internal.pageSize.getHeight() - 20) {
                pdf.addPage();
                currentY = 10;
            }
            
            // Export note with text and drawing
            currentY = await exportNoteAsPDF(tab, pdf, currentY);
            
            // Save individual PDF
            const individualPdf = new jsPDF();
            await exportNoteAsPDF(tab, individualPdf, 10);
            pdfFolder.file(`${tab.title}.pdf`, await individualPdf.output('blob'));
            
            // Save images
            imagesFolder.file(`${tab.title}_text.png`, await html2canvas(tempDiv).then(canvas => 
                canvas.toDataURL('image/png').split('base64,')[1]
            ), {base64: true});
            
            if (tab.canvasData && !isCanvasEmpty(tab.canvasData)) {
                imagesFolder.file(
                    `${tab.title}_drawing.png`, 
                    tab.canvasData.toDataURL('image/png').split('base64,')[1], 
                    {base64: true}
                );
            }
        }
        
        // Save everything
        pdf.save('all_notes.pdf');
        zip.generateAsync({type:"blob"}).then(function(content) {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'all_notes.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    });

    function isCanvasEmpty(canvas) {
        const context = canvas.getContext('2d');
        const pixelBuffer = new Uint32Array(
            context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
        );
        return !pixelBuffer.some(color => color !== 0);
    }
});
