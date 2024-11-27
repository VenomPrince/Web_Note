document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const textArea = document.getElementById('textArea');
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const commandInput = document.getElementById('commandInput');
    const commandSuggestions = document.getElementById('commandSuggestions');

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

    // Command suggestion system
    let selectedSuggestionIndex = -1;
    let isShowingSuggestions = false;

    let isCheckboxMode = false;
    let currentFormatting = null; // Track current formatting mode

    const commands = {
        '/end': {
            icon: 'fa-stop',
            description: 'End current formatting',
            priority: 1, // Highest priority for main /end command
            execute: () => {
                // Create a new paragraph with default styling
                const p = document.createElement('p');
                p.className = 'default-text';
                p.contentEditable = true;
                
                // Insert it at the current position
                const selection = window.getSelection();
                if (selection.rangeCount) {
                    const range = selection.getRangeAt(0);
                    
                    // Find the current formatted element
                    let currentElement = range.commonAncestorContainer;
                    while (currentElement && currentElement.nodeType !== Node.ELEMENT_NODE) {
                        currentElement = currentElement.parentNode;
                    }
                    
                    if (currentElement) {
                        // Insert the new paragraph after the current element
                        currentElement.parentNode.insertBefore(p, currentElement.nextSibling);
                        
                        // Move cursor to the new paragraph
                        const newRange = document.createRange();
                        newRange.setStart(p, 0);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                        
                        // Reset all formatting states
                        currentFormatting = null;
                        isCheckboxMode = false;
                    }
                }
                return '';
            }
        },
        '/end checkbox': {
            icon: 'fa-square',
            description: 'End checkbox list mode',
            priority: 2, // Lower priority than main /end
            execute: () => {
                isCheckboxMode = false;
                return '';
            }
        },
        '/bold': {
            icon: 'fa-bold',
            description: 'Start bold text',
            execute: () => {
                currentFormatting = 'bold';
                const span = document.createElement('span');
                span.style.fontWeight = 'bold';
                insertElementAtCaret(span);
                return '';
            }
        },
        '/italic': {
            icon: 'fa-italic',
            description: 'Start italic text',
            execute: () => {
                currentFormatting = 'italic';
                const span = document.createElement('span');
                span.style.fontStyle = 'italic';
                insertElementAtCaret(span);
                return '';
            }
        },
        '/underline': {
            icon: 'fa-underline',
            description: 'Start underlined text',
            execute: () => {
                currentFormatting = 'underline';
                const span = document.createElement('span');
                span.style.textDecoration = 'underline';
                insertElementAtCaret(span);
                return '';
            }
        },
        '/color': {
            icon: 'fa-palette',
            description: 'Start colored text',
            suggestions: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
            execute: (color) => {
                currentFormatting = 'color';
                const div = document.createElement('div');
                div.style.color = color;
                div.setAttribute('data-color', color);
                div.contentEditable = true;
                insertElementAtCaret(div);
                return '';
            }
        },
        '/checkbox': {
            icon: 'fa-square',
            description: 'Start checkbox list',
            execute: () => {
                isCheckboxMode = true;
                const div = createCheckboxItem();
                insertHtmlAtCaret(div.outerHTML);
                const insertedSpan = textArea.querySelector('.checkbox-item:last-child .checkbox-text');
                insertedSpan.focus();
                return null;
            }
        },
        '/h1': {
            icon: 'fa-heading',
            description: 'Heading 1',
            execute: () => {
                currentFormatting = 'h1';
                const div = document.createElement('div');
                div.setAttribute('data-format', 'h1');
                div.contentEditable = true;
                insertElementAtCaret(div);
                return '';
            }
        },
        '/h2': {
            icon: 'fa-heading',
            description: 'Heading 2',
            execute: () => {
                currentFormatting = 'h2';
                const div = document.createElement('div');
                div.setAttribute('data-format', 'h2');
                div.contentEditable = true;
                insertElementAtCaret(div);
                return '';
            }
        },
        '/h3': {
            icon: 'fa-heading',
            description: 'Heading 3',
            execute: () => {
                currentFormatting = 'h3';
                const div = document.createElement('div');
                div.setAttribute('data-format', 'h3');
                div.contentEditable = true;
                insertElementAtCaret(div);
                return '';
            }
        },
        '/h4': {
            icon: 'fa-heading',
            description: 'Heading 4',
            execute: () => {
                currentFormatting = 'h4';
                const div = document.createElement('div');
                div.setAttribute('data-format', 'h4');
                div.contentEditable = true;
                insertElementAtCaret(div);
                return '';
            }
        },
        '/h5': {
            icon: 'fa-heading',
            description: 'Heading 5',
            execute: () => {
                currentFormatting = 'h5';
                const div = document.createElement('div');
                div.setAttribute('data-format', 'h5');
                div.contentEditable = true;
                insertElementAtCaret(div);
                return '';
            }
        },
        '/bullet': {
            icon: 'fa-circle',
            description: 'Add a bullet point',
            execute: () => {
                return '<div class="bullet-item">• <span contenteditable="true"></span></div>';
            }
        },
        '/numbered': {
            icon: 'fa-list-ol',
            description: 'Add a numbered list item',
            execute: () => {
                return '<div class="numbered-item"><span class="number"></span><span contenteditable="true"></span></div>';
            }
        },
        '/quote': {
            icon: 'fa-quote-left',
            description: 'Start a quote block',
            execute: () => {
                return '<blockquote class="quote-block" contenteditable="true"></blockquote>';
            }
        },
        '/code': {
            icon: 'fa-code',
            description: 'Start a code block',
            execute: () => {
                return '<code class="code-block" contenteditable="true"></code>';
            }
        }
    };

    function createCheckboxItem() {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <div class="checkbox-container">
                <input type="checkbox" class="checkbox-input">
                <span class="checkbox-text" contenteditable="true" spellcheck="false"></span>
            </div>
        `;
        
        const checkbox = div.querySelector('.checkbox-input');
        const textSpan = div.querySelector('.checkbox-text');
        
        // Prevent default behavior when clicking checkbox
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            textSpan.classList.toggle('checked', checkbox.checked);
        });
        
        // Handle text editing
        textSpan.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && isCheckboxMode) {
                e.preventDefault();
                const newDiv = createCheckboxItem();
                div.parentNode.insertBefore(newDiv, div.nextSibling);
                newDiv.querySelector('.checkbox-text').focus();
            }
            // Handle backspace at the start of text
            if (e.key === 'Backspace' && textSpan.textContent.length === 0) {
                e.preventDefault();
                if (div.previousElementSibling && div.previousElementSibling.classList.contains('checkbox-item')) {
                    const prevTextSpan = div.previousElementSibling.querySelector('.checkbox-text');
                    prevTextSpan.focus();
                    // Place cursor at the end of the previous text
                    const range = document.createRange();
                    range.selectNodeContents(prevTextSpan);
                    range.collapse(false);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                    div.remove();
                }
            }
        });

        // Ensure cursor stays in the text span
        textSpan.addEventListener('focus', () => {
            if (textSpan.textContent.length === 0) {
                const range = document.createRange();
                range.setStart(textSpan, 0);
                range.collapse(true);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });

        return div;
    }

    // Add event listener for checkbox clicks
    textArea.addEventListener('click', (e) => {
        if (e.target.classList.contains('checkbox-input')) {
            e.stopPropagation();
            const textSpan = e.target.parentElement.querySelector('.checkbox-text');
            textSpan.classList.toggle('checked', e.target.checked);
        }
    });

    // Track active formats
    const activeFormats = new Set();

    function startFormatting(type, value = null) {
        const format = { type, value };
        activeFormats.add(format);
        
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        
        let wrapper;
        switch(type) {
            case 'bold':
                wrapper = document.createElement('strong');
                break;
            case 'italic':
                wrapper = document.createElement('em');
                break;
            case 'underline':
                wrapper = document.createElement('u');
                break;
            case 'color':
                wrapper = document.createElement('span');
                wrapper.style.color = value;
                break;
            case 'size':
                wrapper = document.createElement('span');
                wrapper.style.fontSize = `${value}px`;
                break;
            case 'quote':
                wrapper = document.createElement('blockquote');
                wrapper.className = 'quote-block';
                break;
            case 'code':
                wrapper = document.createElement('code');
                wrapper.className = 'code-block';
                break;
        }
        
        range.insertNode(wrapper);
        range.setStart(wrapper, 0);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function endFormatting(format) {
        activeFormats.delete(format);
    }

    function getCaretPosition() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return null;
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(textArea);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        const rect = range.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.bottom,
            text: preCaretRange.toString()
        };
    }

    function showSuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            hideSuggestions();
            return;
        }

        commandSuggestions.innerHTML = suggestions.map((suggestion, index) => `
            <div class="suggestion ${index === selectedSuggestionIndex ? 'selected' : ''}" 
                 data-index="${index}">
                <i class="fas ${suggestion.icon}"></i>
                <span class="command">${suggestion.command}</span>
                <span class="description">${suggestion.description}</span>
            </div>
        `).join('');

        // Position the suggestions
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            commandSuggestions.style.display = 'block';
            commandSuggestions.style.left = `${rect.left}px`;
            commandSuggestions.style.top = `${rect.bottom + 5}px`;
        }

        isShowingSuggestions = true;
    }

    function hideSuggestions() {
        commandSuggestions.style.display = 'none';
        selectedSuggestionIndex = -1;
        isShowingSuggestions = false;
    }

    function getCurrentCommandText() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return '';

        const range = selection.getRangeAt(0);
        const text = range.startContainer.textContent;
        const lastIndex = text.lastIndexOf('/', range.startOffset);
        
        if (lastIndex === -1) return '';
        return text.substring(lastIndex, range.startOffset);
    }

    function getCommandSuggestions(text) {
        const suggestions = [];
        if (!text.startsWith('/')) return suggestions;

        const [baseCommand, param] = text.split(' ');
        
        // If we have a parameter (like in /color red)
        if (param !== undefined) {
            // Handle color command specifically
            if (baseCommand === '/color') {
                const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
                colors.forEach(color => {
                    if (color.startsWith(param.toLowerCase())) {
                        suggestions.push({
                            command: '/color',
                            param: color,
                            icon: 'fa-palette',
                            description: `Set text color to ${color}`
                        });
                    }
                });
            }
        } else {
            // Show base command suggestions
            Object.entries(commands).forEach(([cmd, details]) => {
                if (cmd.startsWith(baseCommand)) {
                    suggestions.push({
                        command: cmd,
                        icon: details.icon,
                        description: details.description
                    });
                }
            });
        }

        return suggestions;
    }

    function applySuggestion(suggestion) {
        if (!suggestion) return;
        
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const text = range.startContainer.textContent;
        const lastIndex = text.lastIndexOf('/', range.startOffset);
        
        if (lastIndex === -1) return;
        
        // Create a range for the command text
        const commandRange = document.createRange();
        commandRange.setStart(range.startContainer, lastIndex);
        commandRange.setEnd(range.startContainer, range.startOffset);
        
        // Delete the command text
        commandRange.deleteContents();
        
        // Execute the command
        const command = commands[suggestion.command];
        if (command) {
            if (suggestion.param) {
                command.execute(suggestion.param);
            } else {
                command.execute();
            }
        }
        
        hideSuggestions();
    }

    function updateSelectedSuggestion() {
        const suggestions = commandSuggestions.querySelectorAll('.suggestion');
        suggestions.forEach((suggestion, index) => {
            suggestion.classList.toggle('selected', index === selectedSuggestionIndex);
        });
    }

    function insertHtmlAtCaret(html) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const fragment = range.createContextualFragment(html);
        range.insertNode(fragment);
        range.collapse(false);
        
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function insertElementAtCaret(element) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        // Create a new range for the text after the command
        const textNode = document.createTextNode('');
        element.appendChild(textNode);
        
        range.insertNode(element);
        
        // Move the caret to the text node
        range.setStart(textNode, 0);
        range.setEnd(textNode, 0);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Handle Enter key to maintain formatting
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && currentFormatting) {
                e.preventDefault();
                
                // Create a new element with the same formatting
                const newElement = element.cloneNode(false);
                newElement.textContent = '';
                
                // Insert after current element
                if (element.nextSibling) {
                    element.parentNode.insertBefore(newElement, element.nextSibling);
                } else {
                    element.parentNode.appendChild(newElement);
                }
                
                // Move cursor to new element
                const newRange = document.createRange();
                newRange.setStart(newElement, 0);
                newRange.setEnd(newElement, 0);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }
        });
    }

    textArea.addEventListener('input', () => {
        const commandText = getCurrentCommandText();
        if (commandText) {
            const suggestions = getCommandSuggestions(commandText);
            if (suggestions.length > 0) {
                selectedSuggestionIndex = 0;
                showSuggestions(suggestions);
            } else {
                hideSuggestions();
            }
        } else {
            hideSuggestions();
        }
    });

    textArea.addEventListener('keydown', (e) => {
        if (isShowingSuggestions) {
            const suggestions = getCommandSuggestions(getCurrentCommandText());
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
                    updateSelectedSuggestion();
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
                    updateSelectedSuggestion();
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
                        applySuggestion(suggestions[selectedSuggestionIndex]);
                    }
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    hideSuggestions();
                    break;
            }
        }
    });

    // Update numbered list items
    function updateNumberedItems() {
        let number = 1;
        textArea.querySelectorAll('.numbered-item').forEach(item => {
            const numberSpan = item.querySelector('.number');
            numberSpan.textContent = `${number}. `;
            number++;
        });
    }

    // Generate unique ID for the device
    const deviceId = localStorage.getItem('deviceId') || generateDeviceId();
    if (!localStorage.getItem('deviceId')) {
        localStorage.setItem('deviceId', deviceId);
    }

    function generateDeviceId() {
        return 'device_' + Math.random().toString(36).substr(2, 9);
    }

    // Auto-save functionality
    let autoSaveTimeout;
    const AUTO_SAVE_DELAY = 2000; // 2 seconds

    function showSaveIndicator() {
        saveIndicator.classList.add('visible');
        setTimeout(() => {
            saveIndicator.classList.remove('visible');
        }, 2000);
    }

    function autoSave() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            saveCurrentNote();
        }, AUTO_SAVE_DELAY);
    }

    // Save current note
    function saveCurrentNote() {
        const currentNote = {
            id: Date.now(),
            content: textArea.innerHTML,
            canvas: canvas.toDataURL(),
            timestamp: new Date().toISOString(),
            title: `Note ${new Date().toLocaleString()}`
        };

        let notes = JSON.parse(localStorage.getItem(`notes_${deviceId}`) || '[]');
        notes.unshift(currentNote);
        localStorage.setItem(`notes_${deviceId}`, JSON.stringify(notes));
        showSaveIndicator();
    }

    // Load note history
    function loadHistory() {
        const notes = JSON.parse(localStorage.getItem(`notes_${deviceId}`) || '[]');
        historyList.innerHTML = '';
        
        notes.forEach(note => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div>${note.title}</div>
                <div style="font-size: 0.8em; color: #888;">
                    ${new Date(note.timestamp).toLocaleString()}
                </div>
            `;
            historyItem.onclick = () => loadNote(note);
            historyList.appendChild(historyItem);
        });
    }

    // Load specific note
    function loadNote(note) {
        textArea.innerHTML = note.content;
        
        // Load canvas
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = note.canvas;
        
        historyModal.style.display = 'none';
    }

    // Export functionality
    async function exportAsPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // First, convert the content to an image
        const canvas = await html2canvas(textArea);
        const imgData = canvas.toDataURL('image/png');
        
        // Add the image to the PDF
        doc.addImage(imgData, 'PNG', 10, 10, 190, 0);
        
        // Save the PDF
        doc.save(`WebNote_${new Date().toISOString()}.pdf`);
    }

    async function exportAsImage() {
        const canvas = await html2canvas(textArea);
        const link = document.createElement('a');
        link.download = `WebNote_${new Date().toISOString()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }

    // Event listeners for new functionality
    textArea.addEventListener('input', autoSave);
    canvas.addEventListener('mouseup', autoSave);

    newPageBtn.addEventListener('click', () => {
        textArea.innerHTML = '';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    saveNoteBtn.addEventListener('click', saveCurrentNote);
    
    exportPDFBtn.addEventListener('click', exportAsPDF);
    exportImageBtn.addEventListener('click', exportAsImage);
    
    historyBtn.addEventListener('click', () => {
        loadHistory();
        historyModal.style.display = 'block';
    });
    
    closeModal.addEventListener('click', () => {
        historyModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            historyModal.style.display = 'none';
        }
    });

    // Handle offline/online events
    window.addEventListener('online', () => {
        const offlineNotes = JSON.parse(localStorage.getItem(`offline_notes_${deviceId}`) || '[]');
        if (offlineNotes.length > 0) {
            offlineNotes.forEach(note => {
                // Here you would typically sync with a server
                console.log('Syncing offline note:', note);
            });
            localStorage.removeItem(`offline_notes_${deviceId}`);
        }
    });

    window.addEventListener('offline', () => {
        // Continue allowing work in offline mode
        // Notes will be saved locally
    });

    // Load the last saved note on startup
    const notes = JSON.parse(localStorage.getItem(`notes_${deviceId}`) || '[]');
    if (notes.length > 0) {
        loadNote(notes[0]);
    }

    // Update the click handler for suggestions
    commandSuggestions.addEventListener('click', (e) => {
        const suggestionElement = e.target.closest('.suggestion');
        if (suggestionElement) {
            const index = parseInt(suggestionElement.dataset.index);
            const suggestions = getCommandSuggestions(getCurrentCommandText());
            if (suggestions[index]) {
                applySuggestion(suggestions[index]);
            }
        }
    });
});
