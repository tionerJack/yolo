# Makefile para compilar el reporte LaTeX
# Uso: make        → compila el PDF
#      make clean  → limpia archivos auxiliares
#      make open   → abre el PDF generado

PDF = reporte.pdf
TEX = reporte.tex
LATEX = pdflatex
FLAGS = -interaction=nonstopmode -halt-on-error

.PHONY: all clean open

all: $(PDF)

$(PDF): $(TEX) img/captura_modulo1.png img/captura_modulo2.png
	$(LATEX) $(FLAGS) $(TEX)
	$(LATEX) $(FLAGS) $(TEX)

clean:
	rm -f *.aux *.log *.out *.toc *.lof *.lot *.bbl *.blg *.fls *.fdb_latexmk

open: $(PDF)
	xdg-open $(PDF) &
