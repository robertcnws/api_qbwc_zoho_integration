import subprocess
import os
import logging
from datetime import datetime
from django.conf import settings

# Configuración
container_name = settings.CONTAINER_NAME
backup_directory_on_pc = settings.ROUTE_TO_BACKUP_DB
pg_user = settings.DB_USER
pg_db = settings.DB_NAME
pg_port = settings.DB_PORT
pg_host = settings.DB_HOST
pg_password = settings.DB_PASSWORD

timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
sql_backup_filename = f"backup_{timestamp}.sql"
custom_backup_filename = f"backup_{timestamp}.custom"
backup_path_sql_in_container = f"/app/backup/{sql_backup_filename}"
backup_path_custom_in_container = f"/app/backup/{custom_backup_filename}"

#############################################
# Configura el logging
#############################################

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def create_backup():
    sql_backup_command = [
        'pg_dump',
        '-U', pg_user,
        '-h', pg_host,
        '-p', pg_port,
        '-f', backup_path_sql_in_container,
        '-F', 'p', 
        pg_db
    ]
    
    custom_backup_command = [
        'pg_dump',
        '-U', pg_user,
        '-h', pg_host,
        '-p', pg_port,
        '-f', backup_path_custom_in_container,
        '-F', 'c', 
        pg_db
    ]
    
    try:
        subprocess.run(sql_backup_command, check=True, env={'PGPASSWORD': pg_password})
        subprocess.run(custom_backup_command, check=True, env={'PGPASSWORD': pg_password})
        
        
        return True
    except subprocess.CalledProcessError as e:
        print(f'Error during backup: {e}')
        return False