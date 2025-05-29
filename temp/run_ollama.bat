@echo off
ollama run llama3.1:8b "hola" > "%~dp0respuesta_ollama.txt" 2> "%~dp0error_ollama.txt"
