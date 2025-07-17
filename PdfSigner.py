import pymupdf

doc = pymupdf.open("TemplatePDF.pdf")
out = open("SignPDF.pdf", "wb")
