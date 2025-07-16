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
        var page = position.page;
        var rect = position.rect; // Это уже массив [left, bottom, right, top]
        
        // Create signature field
        var fieldName = "Signature_" + page + "_" + Math.random().toString(36).substr(2, 5);
        var field = this.addField(fieldName, "signature", page - 1, rect); // Страницы в Acrobat JS нумеруются с 0
        
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
        this.addAnnot({
            type: "Square",
            page: position.page - 1, // Страницы в Acrobat JS нумеруются с 0
            rect: position.rect,
            strokeColor: color.white,
            fillColor: color.white,
            opacity: 1
        });
    } catch (e) {
        console.println("Не удалось затереть текст: " + e.message);
    }
}