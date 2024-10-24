#!/bin/bash
set -e

# Lista de bases de datos a crear
DBS=("api_qbwc_zoho_dev_db" "api_qbwc_zoho_qa_db" "api_qbwc_zoho_prod_db" "api_qbwc_zoho_envqa_db" "api_qbwc_zoho_envprod_db")

for DB in "${DBS[@]}"; do
    echo "Verificando si la base de datos '$DB' existe..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
        SELECT 1 FROM pg_database WHERE datname = '$DB';
    EOSQL

    EXISTS=$(psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB'" | grep -c 1)

    if [ $EXISTS -eq 0 ]; then
        echo "Creando la base de datos '$DB'..."
        createdb -U "$POSTGRES_USER" "$DB"
    else
        echo "La base de datos '$DB' ya existe. Saltando..."
    fi
done
