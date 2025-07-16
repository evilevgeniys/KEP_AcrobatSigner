/**
 * СКРИПТ ДЛЯ ЗАМЕНЫ ТЕКСТА ГОРИЗОНТАЛЬНЫМИ ШТАМПАМИ
 * Версия 2.1 (исправлены ошибки передачи параметров)
 */

// Конфигурация
var CONFIG = {
    DEFAULT_SEARCH_TEXT: "Утверждено",
    DEFAULT_STAMP_NAME: "Approved",
    STAMP_HEIGHT_RATIO: 0.4,
    ERASER_PADDING: 1
};

// Главная функция
function replaceTextWithStamp() {
    try {
        // Получаем текущий документ
        var doc = this;
        
        // Шаг 1: Получаем данные от пользователя
        var userInput = getInputFromUser();
        if (!userInput) return;
        
        // Шаг 2: Ищем текст в документе
        var foundItems = findTextInDocument(doc, userInput.searchText);
        if (!foundItems || foundItems.length === 0) {
            showAlert("Текст '" + userInput.searchText + "' не найден в документе.");
            return;
        }
        
        // Шаг 3: Обрабатываем найденные элементы
        var results = {
            total: foundItems.length,
            success: 0,
            errors: 0
        };
        
        for (var i = 0; i < foundItems.length; i++) {
            try {
                // Передаем все необходимые параметры
                if (processTextReplacement(doc, userInput.stampName, foundItems[i])) {
                    results.success++;
                } else {
                    results.errors++;
                }
            } catch (e) {
                console.println("Ошибка при обработке элемента " + i + ": " + e);
                results.errors++;
            }
        }
        
        // Шаг 4: Показываем результаты
        showResults(results, userInput.searchText);
    } catch (e) {
        showAlert("Критическая ошибка: " + e.message);
    }
}

// Основная функция обработки замены
function processTextReplacement(doc, stampName, positionData) {
    try {
        // 1. Стираем оригинальный текст
        eraseText(doc, positionData);
        
        // 2. Рассчитываем позицию для штампа
        var stampRect = [
            positionData.rect[0],
            positionData.rect[1],
            positionData.rect[0] + (positionData.rect[2] - positionData.rect[0]),
            positionData.rect[1] + (positionData.rect[3] - positionData.rect[1]) * CONFIG.STAMP_HEIGHT_RATIO
        ];
        
        // 3. Добавляем штамп
        var stamp = doc.addAnnot({
            type: "Stamp",
            page: positionData.page - 1,
            rect: stampRect,
            AP: "/" + stampName,
            rotation: 0,
            opacity: 1
        });
        
        // 4. Принудительно исправляем ориентацию если нужно
        if (stamp.rotation && stamp.rotation != 0) {
            stamp.rotation = 0;
            stamp.dirty = true;
        }
        
        return true;
    } catch (e) {
        console.println("Ошибка при замене текста: " + e.message);
        return false;
    }
}

// Остальные вспомогательные функции остаются без изменений:
// getInputFromUser(), findTextInDocument(), calculateBoundingRect()
// eraseText(), showResults(), showAlert()

// Проверка версии и запуск
if (app.viewerVersion >= 8) {
    if (this.addAnnot) {    
        replaceTextWithStamp();
    } else {
        showAlert("Для работы скрипта требуется Adobe Acrobat Pro");
    }
} else {
    showAlert("Требуется Adobe Acrobat версии 8 или выше");
}