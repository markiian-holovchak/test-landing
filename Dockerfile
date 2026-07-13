FROM nginx:alpine

COPY index.html /usr/share/nginx/html/index.html
COPY styles.css /usr/share/nginx/html/styles.css
COPY auth.js /usr/share/nginx/html/auth.js

COPY nginx.conf.template /etc/nginx/templates/default.conf.template

ENV PORT=8080

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
