import fitz  # PyMuPDF
import os
from tkinter import *
from tkinter import filedialog, messagebox, ttk

class PDFSignatureApp:
    def __init__(self, master):
        self.master = master
        master.title("PDF Signer Pro")
        self.center_window(500, 350)
        
        # Стили
        self.style = ttk.Style()
        self.style.configure('TButton', padding=5, font=('Arial', 10))
        self.style.configure('TLabel', font=('Arial', 10))
        self.style.configure('TFrame', background='#f0f0f0')
        
        # Переменные
        self.signature_path = StringVar()
        self.pdf_path = StringVar()
        self.search_text = StringVar()
        self.erase_original = BooleanVar(value=True)
        
        # Создание интерфейса
        self.create_widgets()
    
    def center_window(self, width, height):
        """Центрирует окно на экране"""
        screen_width = self.master.winfo_screenwidth()
        screen_height = self.master.winfo_screenheight()
        x = int((screen_width/2) - (width/2))
        y = int((screen_height/2) - (height/2))
        self.master.geometry(f"{width}x{height}+{x}+{y}")
    
    def create_widgets(self):
        # Основной контейнер с padding
        main_frame = ttk.Frame(self.master, padding="20")
        main_frame.pack(fill=BOTH, expand=True)
        
        # Центрирование содержимого
        content_frame = ttk.Frame(main_frame)
        content_frame.pack(expand=True)
        
        # 1. Выбор подписи
        self.create_label_entry_pair(
            content_frame, 
            "Файл подписи (PNG):", 
            self.signature_path, 
            self.select_signature,
            row=0
        )
        
        # 2. Выбор PDF
        self.create_label_entry_pair(
            content_frame,
            "PDF документ:",
            self.pdf_path,
            self.select_pdf,
            row=1
        )
        
        # 3. Текст для замены
        self.create_label_entry_pair(
            content_frame,
            "Текст для замены:",
            self.search_text,
            None,
            row=2
        )
        
        # 4. Настройки (центрированная checkbutton)
        settings_frame = ttk.Frame(content_frame)
        settings_frame.grid(row=3, column=0, columnspan=3, pady=10, sticky="ew")
        settings_frame.grid_columnconfigure(0, weight=1)
        
        chk = ttk.Checkbutton(
            settings_frame, 
            text="Затереть оригинальный текст",
            variable=self.erase_original
        )
        chk.grid(sticky="w")
        
        # 5. Кнопка обработки (центрированная)
        btn_frame = ttk.Frame(content_frame)
        btn_frame.grid(row=4, column=0, columnspan=3, pady=15, sticky="ew")
        btn_frame.grid_columnconfigure(0, weight=1)
        
        ttk.Button(
            btn_frame, 
            text="ЗАМЕНИТЬ ТЕКСТ НА ПОДПИСЬ", 
            command=self.process_pdf,
            style='Accent.TButton'
        ).grid(sticky="ew")
        
        # 6. Статус (центрированный)
        status_frame = ttk.Frame(content_frame)
        status_frame.grid(row=5, column=0, columnspan=3, sticky="ew")
        status_frame.grid_columnconfigure(0, weight=1)
        
        self.status_label = ttk.Label(
            status_frame, 
            text="", 
            foreground="gray",
            anchor="center"
        )
        self.status_label.grid(sticky="ew")
        
        # Настройка колонок для центрирования
        content_frame.grid_columnconfigure(0, weight=1)  # Левый padding
        content_frame.grid_columnconfigure(1, weight=0)  # Содержимое
        content_frame.grid_columnconfigure(2, weight=1)  # Правый padding
        
        # Стиль для акцентной кнопки
        self.style.configure('Accent.TButton', foreground='white', background='#4CAF50')
    
    def create_label_entry_pair(self, parent, label_text, textvariable, command, row):
        """Создает пару Label-Entry-Button с центрированием"""
        # Label
        ttk.Label(
            parent, 
            text=label_text,
            padding="0 0 10 0"  # Правое padding
        ).grid(row=row, column=0, sticky="e")
        
        # Entry
        entry = ttk.Entry(parent, textvariable=textvariable, width=30)
        entry.grid(row=row, column=1, padx=5, sticky="ew")
        
        # Button (если есть command)
        if command:
            ttk.Button(
                parent,
                text="Обзор",
                command=command,
                width=8
            ).grid(row=row, column=2, sticky="w")
        
        # Выравнивание строки
        parent.grid_rowconfigure(row, weight=1)
    
    # Остальные методы остаются без изменений
    def select_signature(self):
        file_path = filedialog.askopenfilename(
            title="Выберите файл подписи",
            filetypes=[("PNG files", "*.png"), ("All files", "*.*")]
        )
        if file_path:
            self.signature_path.set(file_path)
    
    def select_pdf(self):
        file_path = filedialog.askopenfilename(
            title="Выберите PDF документ",
            filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")]
        )
        if file_path:
            self.pdf_path.set(file_path)
    
    def process_pdf(self):
        if not all([self.signature_path.get(), self.pdf_path.get(), self.search_text.get()]):
            messagebox.showerror("Ошибка", "Пожалуйста, заполните все поля!")
            return
        
        try:
            base_name = os.path.basename(self.pdf_path.get())
            output_name = f"Подписанный_{base_name}"
            output_path = os.path.join(os.path.dirname(self.pdf_path.get()), output_name)
            
            self.find_and_replace_text_with_image(
                self.pdf_path.get(),
                output_path,
                self.search_text.get(),
                self.signature_path.get(),
                self.erase_original.get()
            )
            
            self.status_label.config(text=f"Документ сохранен: {output_path}", foreground="green")
            
            if messagebox.askyesno("Успех", "Открыть полученный файл?"):
                if os.name == 'nt':
                    os.startfile(output_path)
                else:
                    os.system(f'xdg-open "{output_path}"' if os.uname().sysname != 'Darwin' else f'open "{output_path}"')
        
        except Exception as e:
            messagebox.showerror("Ошибка", f"Произошла ошибка:\n{str(e)}")
            self.status_label.config(text="Ошибка обработки", foreground="red")
    
    def find_and_replace_text_with_image(self, pdf_path, output_path, search_text, image_path, erase_original):
        doc = fitz.open(pdf_path)
        
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Изображение не найдено: {image_path}")
        
        try:
            test_img = fitz.Pixmap(image_path)
            test_img = None
        except:
            raise ValueError(f"Невозможно загрузить изображение: {image_path}")

        for page in doc:
            text_instances = page.search_for(search_text)
            
            for inst in text_instances:
                text_width = inst.x1 - inst.x0
                text_height = inst.y1 - inst.y0
                
                if erase_original:
                    erase_rect = fitz.Rect(
                        inst.x0 + text_width * 0.05,
                        inst.y0 + text_height * 0.05,
                        inst.x1 - text_width * 0.05,
                        inst.y1 - text_height * 0.05
                    )
                    page.add_redact_annot(erase_rect, fill=(1, 1, 1))
                    page.apply_redactions()

                img_rect = fitz.Rect(
                    inst.x0, 
                    inst.y0 - 2,
                    inst.x0 + (inst.x1 - inst.x0),
                    inst.y1 + 2
                )
                
                try:
                    page.insert_image(img_rect, filename=image_path, keep_proportion=False)
                except:
                    try:
                        pix = fitz.Pixmap(image_path)
                        page.insert_image(img_rect, pixmap=pix)
                        pix = None
                    except:
                        img_doc = fitz.open()
                        img_page = img_doc.new_page(width=img_rect.width, height=img_rect.height)
                        img_page.insert_image(img_rect, filename=image_path)
                        page.show_pdf_page(img_rect, img_doc, 0)
                        img_doc.close()

        doc.save(output_path, garbage=3, deflate=True)
        doc.close()

if __name__ == "__main__":
    root = Tk()
    app = PDFSignatureApp(root)
    root.mainloop()