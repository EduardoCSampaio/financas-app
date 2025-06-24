# Backend FastAPI

## Como rodar localmente

1. Ative o ambiente virtual:
   
   ```powershell
   backend_venv\Scripts\activate
   ```

2. Instale as dependências (já feito, mas caso precise):
   
   ```bash
   pip install fastapi uvicorn[standard] python-multipart sqlalchemy jinja2
   ```

3. Rode o servidor:
   
   ```bash
   uvicorn app.main:app --reload --app-dir backend
   ```

Acesse: http://localhost:8000 

# Como rodar o backend ouvindo em toda a rede

```
uvicorn app.main:app --reload --host 0.0.0.0
```

Assim o backend pode ser acessado por outros dispositivos na mesma rede. 