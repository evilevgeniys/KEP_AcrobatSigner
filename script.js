// Main function
function addSignatureFromPNG() {
    try {
        // Step 1: Get search keyword from user
        var searchKeyword = app.response({
            cQuestion: "Введите слово для поиска (например 'План'):",
            cTitle: "Ключевое слово",
            cDefault: "План",
            bPassword: false
        });
        
        if (!searchKeyword) return; // User cancelled
        
        // Step 2: Get PNG file path via user input
        var pngPath = getPNGFilePath();
        if (!pngPath) return; // User cancelled
        
        // Step 3: Import PNG as icon named "TempSign"
        importIconFromPNG(pngPath, "TempSign");
        
        // Step 4: Find keyword in document
        var foundItems = findTextInDocument(searchKeyword);
        if (foundItems.length === 0) {
            app.alert("Текст '" + searchKeyword + "' не найден в документе.", 1);
            return;
        }
        
        // Step 5: Process each found item
        processFoundItems(foundItems, "TempSign");
        
        app.alert("Подписи успешно добавлены для слова '" + searchKeyword + "'!", 1);
    } catch (e) {
        app.alert("Ошибка: " + e.message, 1);
    }
}

// Get PNG file path via dialog
function getPNGFilePath() {
    var response = app.response({
        cQuestion: "Введите полный путь к PNG файлу (например, C:\\signature.png):",
        cTitle: "Выбор файла подписи",
        cDefault: "",
        bPassword: false
    });
    
    if (response === null || response === "") return null;
    
    // Basic validation
    if (!response.toLowerCase().endsWith(".png")) {
        app.alert("Файл должен иметь расширение .png", 1);
        return null;
    }
    
    return response;
}

// Import PNG as icon
function importIconFromPNG(filePath, iconName) {
    try {
        // First remove icon if it exists
        try {
            this.removeIcon(iconName);
        } catch (e) {}
        
        // Import new icon
        this.importIcon(filePath, iconName);
    } catch (e) {
        throw new Error("Не удалось импортировать иконку. Проверьте путь к файлу.\n" + e.message);
    }
}

function findTextInDocument(searchText, caseSensitive = false) {
    if (!searchText || typeof searchText !== 'string') {
        throw new Error('Неверный текст для поиска');
    }

    const results = [];
    const doc = this;
    const numPages = doc.numPages;
    const searchStr = caseSensitive ? searchText : searchText.toLowerCase();

    for (let pageNum = 0; pageNum < numPages; pageNum++) {
        try {
            // Получаем количество слов на странице
            const numWords = doc.getPageNumWords(pageNum);
            
            for (let wordIdx = 0; wordIdx < numWords; wordIdx++) {
                try {
                    const word = doc.getPageNthWord(pageNum, wordIdx, false);
                    const compareWord = caseSensitive ? word : word.toLowerCase();
                    
                    if (compareWord.indexOf(searchStr) !== -1) {
                        const quads = doc.getPageNthWordQuads(pageNum, wordIdx);
                        results.push({
                            page: pageNum + 1,
                            wordIndex: wordIdx,
                            text: word,
                            quads: quads,
                            rect: calculateBoundingRect(quads)
                        });
                    }
                } catch (e) {
                    console.println('Ошибка при обработке слова: ' + e);
                }
            }
        } catch (e) {
            console.println('Ошибка при обработке страницы ' + (pageNum + 1) + ': ' + e);
        }
    }

    return results;
}

function calculateBoundingRect(quads) {
    let left = Number.MAX_VALUE;
    let bottom = Number.MAX_VALUE;
    let right = -Number.MAX_VALUE;
    let top = -Number.MAX_VALUE;

    for (let i = 0; i < 8; i += 2) {
        left = Math.min(left, quads[0][i]);
        bottom = Math.min(bottom, quads[0][i+1]);
        right = Math.max(right, quads[0][i]);
        top = Math.max(top, quads[0][i+1]);
    }

    return [left, bottom, right, top];
}
// Process found items (add signature and optionally remove text)
function processFoundItems(items, iconName) {
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        addSignatureAtPosition(iconName, item);
        removeText(item); // Опционально: затереть оригинальный текст
    }
}

// Add signature at position
function addSignatureAtPosition(iconName, position) {
    try {
        var page = position.pageNum;
        var quad = position.rect[0];
        
        // Calculate position (simplified)
        var left = Math.min(quad[0], quad[2], quad[4], quad[6]);
        var bottom = Math.min(quad[1], quad[3], quad[5], quad[7]);
        var right = Math.max(quad[0], quad[2], quad[4], quad[6]);
        var top = Math.max(quad[1], quad[3], quad[5], quad[7]);
        
        // Create signature field
        var fieldName = "Signature_" + page + "_";
        var field = this.addField(fieldName, "signature", page, [left, bottom, right, top]);
        
        // Apply icon
        field.buttonSetIcon(iconName);
        field.display = display.hidden;
    } catch (e) {
        console.println("Ошибка при добавлении подписи: " + e.message);
    }
}

// Remove original text (optional)
function removeText(position) {
    try {
        var quad = position.rect[0];
        this.addAnnot({
            type: "Square",
            page: position.pageNum,
            rect: quad,
            strokeColor: color.white,
            fillColor: color.white,
            opacity: 1
        });
    } catch (e) {
        console.println("Не удалось затереть текст: " + e.message);
    }
}

// Execute
if (app.viewerVersion >= 8) {
    addSignatureFromPNG();
} else {
    app.alert("Требуется Adobe Acrobat версии 8 или выше", 1);
}