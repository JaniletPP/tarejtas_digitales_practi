"""
Script para inicializar la base de datos
Ejecutar este archivo para crear todas las tablas necesarias
"""
from schema import init_database

if __name__ == '__main__':
    print("Inicializando base de datos...")
    print("=" * 50)
    try:
        init_database()
        print("=" * 50)
        print("[OK] Base de datos lista para usar")
    except Exception as e:
        print("=" * 50)
        print(f"[ERROR] Error: {e}")
        print("\nVerifica que:")
        print("1. MySQL esté instalado y ejecutándose")
        print("2. Las credenciales en config.py sean correctas")
        print("3. Tengas permisos para crear bases de datos")
