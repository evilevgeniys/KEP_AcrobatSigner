 function replacePlanWithImportedSignature() {
  var targetWord = "План";
  var iconName = "TempSign";

    try {
        var iconFile = app.browseForDoc({
        cType: "PNG",
        cTitle: "Выберите файл PNG с подписью"
        });

        if (!iconFile) {
        app.alert("Выбор отменён.");
        return;
    }
        this.importIcon(iconName, iconFile);

  } catch (e) {
    app.alert("Ошибка при импорте подписи: " + e);
    return;
  }