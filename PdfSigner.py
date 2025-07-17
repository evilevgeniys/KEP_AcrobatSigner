import pymupdf

doc = pymupdf.open("TemplatePDF.pdf")
out = open("SignPDF.pdf", "wb")
import pymupdf  # PyMuPDF
import os
from tkinter import Tk, filedialog, simpledialog, messagebox

def select_png_file():
    """Открывает диалог выбора PNG-файла"""
    root = Tk()
    root.withdraw()  # Скрываем основное окно
    file_path = filedialog.askopenfilename(
        title="Выберите файл подписи (PNG)",
        filetypes=[("PNG files", "*.png"), ("All files", "*.*")]
    )
    return file_path

def find_and_replace_text_with_image(pdf_path, output_path, search_text, image_path, erase_original=True):
    """
    Находит текст в PDF и заменяет его изображением.
    
    :param pdf_path: Путь к исходному PDF
    :param output_path: Путь для сохранения изменённого PDF
    :param search_text: Текст для поиска и замены
    :param image_path: Путь к изображению PNG
    :param erase_original: Нужно ли затирать оригинальный текст
    """
    doc = pymupdf.open(pdf_path)
    
    for page in doc:
        # Ищем все вхождения текста
        text_instances = page.search_for(search_text)
        
        for inst in text_instances:
            # Вставляем изображение
            rect = pymupdf.Rect(inst.x0, inst.y0, inst.x1, inst.y1)
            page.insert_image(rect, filename=image_path)
            
            # Затираем оригинальный текст (если нужно)
            if erase_original:
                page.add_redact_annot(inst, fill=(1, 1, 1))  # Белый цвет
                page.apply_redactions()
    
    doc.save(output_path)
    doc.close()

def main():
    # 1. Выбираем файл подписи (PNG)
    image_path = select_png_file()
    if not image_path:
        print("Файл не выбран. Выход.")
        return
    
    # 2. Запрашиваем текст для поиска
    search_text = simpledialog.askstring("Ввод текста", "Введите слово/фразу для замены:")
    if not search_text:
        print("Текст не введён. Выход.")
        return
    
    # 3. Выбираем PDF-файл
    root = Tk()
    root.withdraw()
    pdf_path = filedialog.askopenfilename(
        title="Выберите PDF-файл",
        filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")]
    )
    if not pdf_path:
        print("PDF не выбран. Выход.")
        return
    
    # 4. Опционально: спрашиваем, нужно ли затирать оригинальный текст
    erase_original = messagebox.askyesno("Подтверждение", "Затереть оригинальный текст?")
    
    # 5. Создаём путь для сохранения
    output_path = os.path.join(
        os.path.dirname(pdf_path),
        f"signed_{os.path.basename(pdf_path)}"
    )
    
    # 6. Заменяем текст на изображение
    find_and_replace_text_with_image(pdf_path, output_path, search_text, image_path, erase_original)
    messagebox.showinfo("Готово", f"Файл сохранён как:\n{output_path}")

if __name__ == "__main__":
    main()
