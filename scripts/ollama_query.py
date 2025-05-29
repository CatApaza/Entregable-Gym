#!/usr/bin/env python
"""
Script para consultar a Ollama desde un proceso separado usando Python
Este script se ejecuta como un proceso independiente para evitar problemas de SIGTERM
"""

import sys
import os
import json
import subprocess
import time

def main():
    # Verificar argumentos
    if len(sys.argv) < 2:
        print("Error: Se requiere un prompt como primer argumento")
        sys.exit(1)
    
    # Configuración
    prompt = sys.argv[1]
    model = sys.argv[2] if len(sys.argv) > 2 else "llama3.1:8b"
    output_file = sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "temp", "ollama_response.txt")
    
    # Crear directorio de salida si no existe
    output_dir = os.path.dirname(output_file)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Mostrar información
    print(f"Consultando a Ollama (modelo: {model})...")
    print(f"Prompt: {prompt[:50]}{'...' if len(prompt) > 50 else ''}")
    
    try:
        # Ejecutar Ollama como un proceso separado
        result = subprocess.run(
            ["ollama", "run", model, prompt],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        # Verificar si hubo errores
        if result.returncode != 0:
            print(f"Error al ejecutar Ollama: {result.stderr}")
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump({
                    "success": False,
                    "error": "Error en la ejecución de Ollama",
                    "stderr": result.stderr
                }, f)
            sys.exit(1)
        
        # Guardar la respuesta en el archivo de salida
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump({
                "success": True,
                "response": result.stdout.strip()
            }, f)
        
        print(f"Respuesta de Ollama guardada en: {output_file}")
        print(f"Respuesta (primeros 100 caracteres): {result.stdout[:100]}{'...' if len(result.stdout) > 100 else ''}")
        
    except subprocess.TimeoutExpired:
        print("Error: Tiempo de espera agotado al ejecutar Ollama")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump({
                "success": False,
                "error": "Tiempo de espera agotado"
            }, f)
        sys.exit(1)
    except Exception as e:
        print(f"Error inesperado: {str(e)}")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump({
                "success": False,
                "error": str(e)
            }, f)
        sys.exit(1)
    
    sys.exit(0)

if __name__ == "__main__":
    main()
