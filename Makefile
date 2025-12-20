# Makefile for DocketDive Development Agent

# Default target
help:
	@echo "Available targets:"
	@echo "  lint-prompt    - Lint the prompt files in the prompts/ directory"
	@echo "  help           - Show this help message"

# Lint the prompts directory
lint-prompt:
	@echo "Linting prompt files..."
	@for file in prompts/*.md; do \
		echo "Checking: $$file"; \
		if ! [ -f "$$file" ]; then \
			echo "Error: $$file does not exist!"; \
			exit 1; \
		fi; \
		# Check for proper formatting \
		if ! grep -q '^---$$' "$$file" 2>/dev/null; then \
			echo "Warning: $$file may not have proper YAML frontmatter"; \
		fi; \
	done
	@echo "Prompt linting completed!"

.PHONY: help lint-prompt