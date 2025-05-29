
import subprocess
import sys

try:
    # Ejecutar Ollama con el prompt proporcionado
    result = subprocess.run(['ollama', 'run', 'llama3.1:8b'], 
                          input=sys.argv[1], 
                          text=True, 
                          capture_output=True, 
                          timeout=60)
    
    # Imprimir la respuesta
    print(result.stdout)
    
    # Guardar la respuesta en un archivo
    with open('C:\\Users\\Usuario\\Downloads\\gimnasioAppa\\gimnasioAppTania\\temp\\py_respuesta.txt', 'w', encoding='utf-8') as f:
        f.write(result.stdout)
    
    sys.exit(0)
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
