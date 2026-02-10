.PHONY: lint format check test

# Run linter
lint:
	uv run ruff check .

# Fix linting issues automatically
lint-fix:
	uv run ruff check --fix .

# Format code with Ruff
format:
	uv run ruff format .

# Check formatting without changing files
format-check:
	uv run ruff format --check .

# Run both linter and formatter checks
check: lint format-check

# Fix all issues (lint + format)
fix: lint-fix format

# Run the development server
dev:
	uv run fastapi dev main.py

# Run tests (add when you have tests)
test:
	@echo "No tests configured yet"
