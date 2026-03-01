"""Vercel serverless entry point for FastAPI."""
import sys
import os

# Add the parent directory (backend root) to sys.path so 'app' can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
