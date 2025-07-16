// Главная функция
function replaceTextWithStamp() {
    try {
        // Шаг 1: Получаем ключевое слово для поиска
        var searchKeyword = app.response({
            cQuestion: "Введите слово или фразу для поиска (например 'Утверждено'):",
            cTitle: "Ключевое слово",
            cDefault: "Утверждено",
            bPassword: false
        });
        
        if (!searchKeyword) return; // Пользователь отменил
        
        // Шаг 2: Получаем имя штампа
        var stampName = app.response({
            cQuestion: "Введите точное имя штампа из коллекции (например 'Approved'):",
            cTitle: "Выбор штампа",
            cDefault: "Approved",
            bPassword: false
        });
        
        if (!stampName) return; // Пользователь отменил
        
        // Шаг 3: Ищем текст в документе
        var foundItems = findTextInDocument(searchKeyword);
        if (foundItems.length === 0) {
            app.alert("Текст '" + searchKeyword + "' не найден в документе.", 1);
            return;
        }
        
        // Шаг 4: Добавляем штампы и стираем текст
        var successCount = processFoundItemsWithStamp(foundItems, stampName);
        
        app.alert("Успешно заменено " + successCount + " из " + foundItems.length + " вхождений слова '" + searchKeyword + "'", 1);
    } catch (e) {
        app.alert("Ошибка: " + e.message, 1);
    }
}

// Поиск текста в документе с дополнительной информацией о размере
function findTextInDocument(searchText) {
    if (!searchText || typeof searchText !== 'string') {
        throw new Error('Неверный текст для поиска');
    }

    const results = [];
    const doc = this;
    const numPages = doc.numPages;
    const searchStr = searchText.toLowerCase();

    for (let pageNum = 0; pageNum < numPages; pageNum++) {
        try {
            const numWords = doc.getPageNumWords(pageNum);
            
            for (let wordIdx = 0; wordIdx < numWords; wordIdx++) {
                try {
                    const word = doc.getPageNthWord(pageNum, wordIdx, false);
                    
                    if (word.toLowerCase().indexOf(searchStr) !== -1) {
                        const quads = doc.getPageNthWordQuads(pageNum, wordIdx);
                        const rect = calculateBoundingRect(quads);
                        
                        // Получаем матрицу преобразования для текста
                        const textWidth = rect[2] - rect[0];
                        const textHeight = rect[3] - rect[1];
                        
                        results.push({
                            page: pageNum + 1,
                            wordIndex: wordIdx,
                            text: word,
                            quads: quads,
                            rect: rect,
                            width: textWidth,
                            height: textHeight
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

// Добавление штампа с сохранением размера текста
function addStampAtPosition(stampName, position) {
    try {
        var page = position.page - 1;
        var rect = position.rect;
        var textWidth = position.width;
        var textHeight = position.height;
        
        // Сначала стираем текст
        eraseText(position);
        
        // Добавляем штамп с размерами исходного текста
        var annot = this.addAnnot({
            type: "Stamp",
            page: page,
            rect: [rect[0], rect[1], rect[0] + textWidth, rect[1] + textHeight],
            AP: stampName,
            author: "AutoStamp",
            contents: "Добавлено автоматически",
            color: color.black,
            opacity: 1,
            locked: false,
            rotation: 0
        });
        
        return true;
    } catch (e) {
        console.println("Ошибка при добавлении штампа: " + e.message);
        return false;
    }
}

// Стирание текста
function eraseText(position) {
    try {
        var page = position.page - 1;
        var rect = position.rect;
        
        this.addAnnot({
            type: "Square",
            page: page,
            rect: rect,
            strokeColor: color.white,
            fillColor: color.white,
            opacity: 1,
            hidden: true,
            locked: true
        });
    } catch (e) {
        console.println("Ошибка при стирании текста: " + e.message);
    }
}

// Обработка всех найденных элементов
function processFoundItemsWithStamp(items, stampName) {
    var successCount = 0;
    for (var i = 0; i < items.length; i++) {
        try {
            if (addStampAtPosition(stampName, items[i])) {
                successCount++;
            }
        } catch (e) {
            console.println("Ошибка при обработке элемента " + i + ": " + e.message);
        }
    }
    return successCount;
}

// Запуск скрипта
if (app.viewerVersion >= 8) {
    if (this.addAnnot) {
        replaceTextWithStamp();
    } else {
        app.alert("Для работы скрипта требуется Adobe Acrobat Pro", 1);
    }
} else {
    app.alert("Требуется Adobe Acrobat версии 8 или выше", 1);
}