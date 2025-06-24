# Use uma imagem oficial do Python
FROM python:3.11-slim

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos do backend para o container
COPY . .

# Instala as dependências
RUN pip install --upgrade pip && pip install -r requirements.txt

# Expõe a porta usada pelo Uvicorn
EXPOSE 8000

# Comando para iniciar o servidor
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
