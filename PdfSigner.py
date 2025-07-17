import fitz  # PyMuPDF
import os
from tkinter import Tk, filedialog, simpledialog, messagebox

def select_png_file():
    """Открывает диалог выбора PNG-файла"""
    root = Tk()
    root.withdraw()
    file_path = filedialog.askopenfilename(
        title="Выберите файл подписи (PNG)",
        filetypes=[("PNG files", "*.png"), ("All files", "*.*")]
    )
    return file_path

def find_and_replace_text_with_image(pdf_path, output_path, search_text, image_path, erase_original=True):
    """
    Улучшенная версия с проверкой изображения
    """
    doc = fitz.open(pdf_path)
    
    # Проверяем, что изображение существует и читается
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Изображение не найдено: {image_path}")
    
    try:
        test_img = fitz.Pixmap(image_path)
        test_img = None  # Освобождаем память
    except:
        raise ValueError(f"Невозможно загрузить изображение: {image_path}")

    for page in doc:
        text_instances = page.search_for(search_text)
        
        for inst in text_instances:
            text_width = inst.x1 - inst.x0
            text_height = inst.y1 - inst.y0
            # Затирание оригинала
            if erase_original:
                erase_rect = fitz.Rect(
                        inst.x0 + text_width * 0.05,
                        inst.y0 + text_height * 0.05,
                        inst.x1 - text_width * 0.05,
                        inst.y1 - text_height * 0.05
                    )
                page.add_redact_annot(erase_rect, fill=(1, 1, 1))  # Белая заливка
                page.apply_redactions()

          # Создаем прямоугольник для изображения (можно настроить размер)
            img_rect = fitz.Rect(
                inst.x0, 
                inst.y0 - 2,  # Смещение вверх для лучшего позиционирования
                inst.x0 + (inst.x1 - inst.x0),  # Увеличиваем ширину в 2 раза
                inst.y1 + 2  # Смещение вниз
            )
            
            # Вставка изображения (3 разных метода)
            try:
                # Метод 1: Стандартная вставка
                page.insert_image(
                    img_rect,
                    filename=image_path,
                    keep_proportion=False  # Сохраняем пропорции
                )
            except:
                try:
                    # Метод 2: Через Pixmap
                    pix = fitz.Pixmap(image_path)
                    page.insert_image(img_rect, pixmap=pix)
                    pix = None
                except:
                    # Метод 3: Самый надежный - создаем новый PDF и импортируем
                    img_doc = fitz.open()
                    img_page = img_doc.new_page(width=img_rect.width, height=img_rect.height)
                    img_page.insert_image(img_rect, filename=image_path)
                    page.show_pdf_page(img_rect, img_doc, 0)
                    img_doc.close()

    
    doc.save(output_path, garbage=3, deflate=True)
    doc.close()

def main():
    try:
        image_path = select_png_file()
        if not image_path:
            messagebox.showerror("Ошибка", "Файл не выбран")
            return
        
        search_text = simpledialog.askstring("Ввод текста", "Введите слово/фразу для замены:")
        if not search_text:
            messagebox.showerror("Ошибка", "Текст не введён")
            return
        
        root = Tk()
        root.withdraw()
        pdf_path = filedialog.askopenfilename(
            title="Выберите PDF-файл",
            filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")]
        )
        if not pdf_path:
            messagebox.showerror("Ошибка", "PDF не выбран")
            return
        
        erase_original = messagebox.askyesno("Подтверждение", "Затереть оригинальный текст?")
        
        output_dir = os.path.dirname(pdf_path)
        output_name = "signed_" + os.path.basename(pdf_path)
        output_path = os.path.join(output_dir, output_name)
        
        counter = 1
        while os.path.exists(output_path):
            output_path = os.path.join(output_dir, f"{os.path.basename(pdf_path)}_Подписанный")
            counter += 1
        
        find_and_replace_text_with_image(pdf_path, output_path, search_text, image_path, erase_original)
        
        if os.path.exists(output_path):
            messagebox.showinfo("Успех", f"Файл успешно сохранён:\n{output_path}")
            # Открываем результат (опционально)
            if messagebox.askyesno("Открыть", "Открыть полученный PDF?"):
                os.startfile(output_path)
        else:
            messagebox.showerror("Ошибка", "Не удалось сохранить файл")
            
    except Exception as e:
        messagebox.showerror("Критическая ошибка", f"Произошла ошибка:\n{str(e)}")

if __name__ == "__main__":
    main()