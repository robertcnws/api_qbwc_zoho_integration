FROM nginx:latest

# volumes:
#       - ./nginx_onpremise/nginx_react_django.conf:/etc/nginx/nginx.conf:ro
#       - ./nginx_onpremise/certs:/etc/nginx/certs:ro
#       - ./api_qbwc_zoho_frontend/build:/usr/share/nginx/html/qbwc 

COPY nginx_onpremise/nginx_react_django.conf /etc/nginx/nginx.conf
COPY nginx_onpremise/certs /etc/nginx/certs
COPY api_qbwc_zoho_frontend/build /usr/share/nginx/html/qbwc