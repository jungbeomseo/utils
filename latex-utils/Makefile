# ============================================================================
# Makefile for LaTeX documents
#
# Compilation is driven by latexmk, so cross-references, the table of
# contents, bibliography (bibtex/biber) and index runs are all resolved
# automatically -- no need to guess how many times to run the engine.
# latexmk ships with TeX Live and MiKTeX.
#
# Pick the TeX engine with the ENGINE variable:
#     make                    # pdflatex (default)
#     make ENGINE=xelatex     # xelatex
#     make ENGINE=lualatex    # lualatex
#
# Other targets:
#     make watch              # rebuild continuously on file changes
#     make view               # build and open the PDF
#     make clean              # remove auxiliary files (keep PDFs)
#     make distclean          # remove auxiliary files and PDFs
#     make help               # list targets
# ============================================================================

# ---- Configuration ---------------------------------------------------------

# TeX engine: pdflatex | xelatex | lualatex
ENGINE ?= pdflatex

# Documents to build: every .tex file containing \documentclass is treated as
# a top-level document, so \input-ed chapters/preamble files are ignored.
# Override to build specific files:   make SOURCES="paper.tex slides.tex"
SOURCES ?= $(shell grep -l -s '\\documentclass' *.tex)
PDFS    := $(SOURCES:.tex=.pdf)

# Directory for auxiliary and output files (set to "." to build in place).
BUILDDIR ?= build

# Set to 1 to allow \write18 / shell escape (needed by minted, gnuplot, ...).
SHELL_ESCAPE ?= 0

LATEXMK ?= latexmk

# ---- Engine selection ------------------------------------------------------

ifeq ($(ENGINE),pdflatex)
  ENGINE_FLAG := -pdf
else ifeq ($(ENGINE),xelatex)
  ENGINE_FLAG := -pdfxe
else ifeq ($(ENGINE),lualatex)
  ENGINE_FLAG := -pdflua
else
  $(error Unknown ENGINE '$(ENGINE)'; use pdflatex, xelatex, or lualatex)
endif

ifeq ($(SHELL_ESCAPE),1)
  SHELL_ESCAPE_FLAG := -shell-escape
endif

# ---- latexmk flags ---------------------------------------------------------

LATEXMK_FLAGS := $(ENGINE_FLAG)              \
                 -interaction=nonstopmode    \
                 -halt-on-error              \
                 -file-line-error            \
                 -synctex=1                  \
                 -output-directory=$(BUILDDIR) \
                 $(SHELL_ESCAPE_FLAG)

# ---- Targets ---------------------------------------------------------------

.PHONY: all watch view clean distclean help
.DEFAULT_GOAL := all

all: $(PDFS)

# Build a PDF from its .tex source. latexmk writes into $(BUILDDIR); the result
# is then placed at the project root for convenience (skipped if BUILDDIR=.).
%.pdf: %.tex
	$(LATEXMK) $(LATEXMK_FLAGS) $<
ifneq ($(BUILDDIR),.)
	@cp -f $(BUILDDIR)/$@ $@
endif

# Watch sources and rebuild on every change (Ctrl-C to stop).
# Builds the first document; override with:  make watch SOURCES=paper.tex
watch:
	$(LATEXMK) $(LATEXMK_FLAGS) -pvc $(firstword $(SOURCES))

# Build and open the PDF in latexmk's configured viewer.
view:
	$(LATEXMK) $(LATEXMK_FLAGS) -pv $(firstword $(SOURCES))

# Remove auxiliary files but keep the generated PDFs.
clean:
	$(LATEXMK) -c -output-directory=$(BUILDDIR) $(SOURCES)

# Remove auxiliary files and the generated PDFs.
distclean:
	$(LATEXMK) -C -output-directory=$(BUILDDIR) $(SOURCES)
	-@rm -f $(PDFS)
	-@rmdir $(BUILDDIR) 2>/dev/null || true

help:
	@echo "Targets:"
	@echo "  all        build all documents (default)"
	@echo "  watch      rebuild continuously on changes"
	@echo "  view       build and open the PDF"
	@echo "  clean      remove auxiliary files (keep PDFs)"
	@echo "  distclean  remove auxiliary files and PDFs"
	@echo ""
	@echo "Engine:        make ENGINE=pdflatex|xelatex|lualatex"
	@echo "Shell escape:  make SHELL_ESCAPE=1"
	@echo "Build dir:     make BUILDDIR=out   (use '.' to build in place)"
