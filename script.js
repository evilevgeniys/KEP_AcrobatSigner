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
            cQuestion: "Введите точное имя штампа из коллекции (например 'Approved'):\n\nДоступные штампы можно посмотреть через меню: Инструменты > Штампы > Управление штампами",
            cTitle: "Выбор штампа",
            cDefault: "Approved",
            bPassword: false
        });
        
        if (!stampName) return; // Пользователь отменил
        
        // Шаг 3: Получаем размер штампа
        var stampSize = app.response({
            cQuestion: "Введите размер штампа в пунктах (рекомендуется 40-100, по умолчанию 60):",
            cTitle: "Размер штампа",
            cDefault: "60",
            bPassword: false
        });
        
        stampSize = parseInt(stampSize) || 60;
        
        // Шаг 4: Ищем текст в документе
        var foundItems = findTextInDocument(searchKeyword);
        if (foundItems.length === 0) {
            app.alert("Текст '" + searchKeyword + "' не найден в документе.", 1);
            return;
        }
        
        // Шаг 5: Добавляем штампы
        processFoundItemsWithStamp(foundItems, stampName, stampSize);
        
        app.alert("Успешно добавлено " + foundItems.length + " штампов для слова '" + searchKeyword + "'!", 1);
    } catch (e) {
        app.alert("Ошибка: " + e.message, 1);
    }
}

// Поиск текста в документе
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
            const numWords = doc.getPageNumWords(pageNum);
            
            for (let wordIdx = 0; wordIdx < numWords; wordIdx++) {
                try {
                    const word = doc.getPageNthWord(pageNum, wordIdx, false);
                    const compareWord = caseSensitive ? word : word.toLowerCase();
                    
                    if (compareWord.indexOf(searchStr) !== -1) {
                        const quads = doc.getPageNthWordQuads(pageNum, wordIdx);
                        results.push({
                            page: pageNum + 1, // Для пользователя страницы нумеруются с 1
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

// Расчет ограничивающего прямоугольника для текста
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

// Добавление штампа на позицию текста
function addStampAtPosition(stampName, position, stampSize) {
    try {
        var page = position.page - 1; // Страницы в JS нумеруются с 0
        var rect = position.rect;
        
        // Рассчитываем центр области текста
        var centerX = (rect[0] + rect[2]) / 2;
        var centerY = (rect[1] + rect[3]) / 2;
        
        // Размер штампа (квадратный)
        var halfSize = stampSize / 2;
        
        // Создаем штамп
        var annot = this.addAnnot({
            type: "Stamp",
            page: page,
            rect: [centerX - halfSize, centerY - halfSize, centerX + halfSize, centerY + halfSize],
            AP: stampName,
            author: "AutoStamp",
            contents: "Добавлено автоматически",
            color: color.black,
            opacity: 1,
            locked: false
        });
        
        // Скрываем оригинальный текст
        hideOriginalText(position);
        
    } catch (e) {
        console.println("Ошибка при добавлении штампа: " + e.message);
        throw e;
    }
}

// Скрытие оригинального текста
function hideOriginalText(position) {
    try {
        var page = position.page - 1;
        var rect = position.rect;
        
        // Добавляем белый прямоугольник поверх текста
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
        console.println("Не удалось скрыть текст: " + e.message);
    }
}

// Обработка всех найденных элементов
function processFoundItemsWithStamp(items, stampName, stampSize) {
    for (var i = 0; i < items.length; i++) {
        try {
            addStampAtPosition(stampName, items[i], stampSize);
        } catch (e) {
            console.println("Ошибка при обработке элемента " + i + ": " + e.message);
        }
    }
}

// Проверка версии и запуск
if (app.viewerVersion >= 8) {
    if (this.addAnnot) { // Проверка, что это Acrobat Pro
        replaceTextWithStamp();
    } else {
        app.alert("Для работы скрипта требуется Adobe Acrobat Pro", 1);
    }
} else {
    app.alert("Требуется Adobe Acrobat версии 8 или выше", 1);
}