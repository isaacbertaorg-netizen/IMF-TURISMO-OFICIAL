# ===========================================================================
# IMF TURISMO — gerador de hash de senha (bcrypt)
# Uso: .\.venv\Scripts\python.exe scripts\gerar_hash_senha.py
# A senha é lida de forma oculta (getpass), evitando problemas de aspas e
# caracteres especiais no terminal. O hash impresso vai para a coluna
# senha_admin / senha_hash no Supabase.
# ===========================================================================

import getpass
import sys

sys.path.insert(0, ".")

from app.core.security import gerar_hash_senha


def main() -> None:
    senha = getpass.getpass("Digite a senha do admin: ")
    if not senha:
        print("Senha vazia. Abortado.", file=sys.stderr)
        raise SystemExit(1)
    print(gerar_hash_senha(senha))


if __name__ == "__main__":
    main()
