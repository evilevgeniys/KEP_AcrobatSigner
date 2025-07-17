// Main function
function replaceTextWithSignature() {
    try {
        // Step 1: Get search keyword from user
        var searchKeyword = app.response({
            cQuestion: "Введите слово для поиска (например 'Подпись'):",
            cTitle: "Ключевое слово",
            cDefault: "Подпись",
            bPassword: false
        });
        
        if (!searchKeyword) return; // User cancelled
        
        // Step 2: Get image file path via file dialog
        var imagePath = getImageFilePath();
        if (!imagePath) return; // User cancelled
        
        // Step 3: Find keyword in document
        var doc = this;
        var foundItems = findTextInDocument(doc, searchKeyword);
        if (foundItems.length === 0) {
            app.alert("Текст '" + searchKeyword + "' не найден в документе.", 1);
            return;
        }
        
        // Step 4: Process each found item - replace text with image
        processFoundItems(doc, foundItems, imagePath);
        
        app.alert("Успешно заменено " + foundItems.length + " вхождений текста '" + searchKeyword + "' на изображение.", 1);
    } catch (e) {
        app.alert("Ошибка: " + e.message, 1);
        console.println("Error: " + e.toString());
    }
}

// Get image file path via dialog
function getImageFilePath() {
    var response = app.response({
        cQuestion: "Введите полный путь к файлу изображения (PNG/JPG):",
        cTitle: "Выбор файла изображения",
        cDefault: "",
        bPassword: false
    });
    
    if (response === null || response === "") return null;
    
    // Basic validation
    var ext = response.toLowerCase();
    if (!ext.endsWith(".png") && !ext.endsWith(".jpg") && !ext.endsWith(".jpeg")) {
        app.alert("Файл должен иметь расширение .png, .jpg или .jpeg", 1);
        return null;
    }
    
    return response;
}

function findTextInDocument(doc, searchText, caseSensitive) {
    if (!searchText || typeof searchText !== 'string') {
        throw new Error('Неверный текст для поиска');
    }

    var results = [];
    var numPages = doc.numPages;
    var searchStr = caseSensitive ? searchText : searchText.toLowerCase();

    for (var pageNum = 0; pageNum < numPages; pageNum++) {
        try {
            var numWords = doc.getPageNumWords(pageNum);
            
            for (var wordIdx = 0; wordIdx < numWords; wordIdx++) {
                try {
                    var word = doc.getPageNthWord(pageNum, wordIdx, false);
                    var compareWord = caseSensitive ? word : word.toLowerCase();
                    
                    if (compareWord.indexOf(searchStr) !== -1) {
                        var quads = doc.getPageNthWordQuads(pageNum, wordIdx);
                        results.push({
                            page: pageNum + 1, // 1-based for user
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
    if (!quads || !quads[0] || quads[0].length < 8) {
        return [0, 0, 100, 50]; // Default size if something went wrong
    }
    
    var q = quads[0];
    var left = Math.min(q[0], q[2], q[4], q[6]);
    var bottom = Math.min(q[1], q[3], q[5], q[7]);
    var right = Math.max(q[0], q[2], q[4], q[6]);
    var top = Math.max(q[1], q[3], q[5], q[7]);
    
    // Add some padding
    var padding = 2;
    return [left-padding, bottom-padding, right+padding, top+padding];
}

// Process found items - replace text with image
function processFoundItems(doc, items, imagePath) {
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        replaceTextWithImage(doc, item.page, item.rect, imagePath);
    }
}

// Replace text area with image
function replaceTextWithImage(doc, pageNum, rect, imagePath) {
    try {
        var page = pageNum - 1; // convert to 0-based
        
        // First add white rectangle to erase text
        doc.addAnnot({
            type: "Square",
            page: page,
            rect: rect,
            strokeColor: color.white,
            fillColor: color.white,
            opacity: 1
        });
        
        // Then add image using ImportDataObject and addIcon
        var imageName = "img_" + pageNum + "_" + new Date().getTime();
        
        // Import image as data object
        doc.importDataObject(imageName, imagePath);
        
        // Create icon from imported image
        var icon = doc.createIcon({
            cData: imageName,
            nPage: page
        });
        
        // Add icon annotation
        doc.addIcon({
            cName: imageName,
            nPage: page,
            nPosX: rect[0],
            nPosY: rect[3],
            nWidth: rect[2] - rect[0],
            nHeight: rect[3] - rect[1]
        });
        
    } catch (e) {
        console.println("Ошибка при замене текста изображением: " + e.message);
        throw e;
    }
}

// Execute
if (app.viewerVersion >= 8) {
    console.show();
    console.clear();
    replaceTextWithSignature();
} else {
    app.alert("Требуется Adobe Acrobat версии 8 или выше", 1);
}