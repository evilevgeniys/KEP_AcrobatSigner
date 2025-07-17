import fitz  # PyMuPDF
import os
from tkinter import Tk, filedialog, simpledialog, messagebox

def select_png_file():
    root = Tk()
    root.withdraw()
    return filedialog.askopenfilename(
        title="Выберите файл подписи (PNG)",
        filetypes=[("PNG files", "*.png"), ("All files", "*.*")]
    )

def find_and_replace_text_with_image(pdf_path, output_path, search_text, image_path, erase_original=True):
    doc = fitz.open(pdf_path)
    
    # Проверка изображения
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Изображение не найдено: {image_path}")
    
    for page in doc:
        text_instances = page.search_for(search_text)
        
        for inst in text_instances:
            # Параметры для точного позиционирования
            text_width = inst.x1 - inst.x0
            text_height = inst.y1 - inst.y0
            
            # 1. Вставка изображения (с небольшим отступом)
            img_rect = fitz.Rect(
                inst.x0 - 2,  # Небольшой отступ слева
                inst.y0 - 2,  # Небольшой отступ сверху
                inst.x0 + text_width + 10,  # Ширина + дополнительное место
                inst.y0 + text_height + 2   # Высота с небольшим запасом
            )
            page.insert_image(img_rect, filename=image_path, keep_proportion=True)
            
            # 2. Точное затирание оригинала (без выхода за границы)
            if erase_original:
                # Уменьшаем область затирания на 10%
                erase_rect = fitz.Rect(
                    inst.x0 + text_width * 0.05,  # Отступ 5% слева
                    inst.y0 + text_height * 0.05, # Отступ 5% сверху
                    inst.x1 - text_width * 0.05,  # Отступ 5% справа
                    inst.y1 - text_height * 0.05  # Отступ 5% снизу
                )
                page.add_redact_annot(erase_rect, fill=(1, 1, 1))  # Белый цвет
                page.apply_redactions()
    
    doc.save(output_path, garbage=3, deflate=True)
    doc.close()

def main():
    try:
        # [Остальной код остается таким же, как в предыдущем примере]
        # ...
        
    except Exception as e:
        messagebox.showerror("Ошибка", f"Произошла ошибка:\n{str(e)}")

if __name__ == "__main__":
    main()