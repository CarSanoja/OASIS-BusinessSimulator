FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create log directory
RUN mkdir -p /var/log/nginx

# Create static and media directories
RUN mkdir -p /var/www/static /var/www/media

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]