# Login Credentials for Testing

## Test Accounts

### PLATFORM_ADMIN
- **Email**: admin@nayara.com
- **Password**: Any password (development mode accepts any password)
- **Access**: Full platform access, manages all tenants and organizations

### DEPARTMENT ADMIN
- **Email**: hr@nayara.com  
- **Password**: Any password (development mode accepts any password)
- **Department**: Human Resources
- **Access**: Manages users within HR department only

### STAFF
- **Email**: staff@nayara.com
- **Password**: Any password (development mode accepts any password)
- **Department**: Sales
- **Access**: Self-service access to their own resources

## Important Notes

1. **Development Mode**: Currently, the authentication accepts any password for testing purposes. This is configured in the backend auth service for development.

2. **Database Seeding**: To create these test accounts, run the database seed command after deployment:
   ```bash
   npm run db:seed
   ```

3. **Production**: In production, proper password authentication will be implemented with secure password hashing using bcrypt.

4. **Magic Link Authentication**: The system also supports magic link authentication via email (requires email service configuration).

## Railway Deployment URLs

- **Frontend**: https://frontend-production-55d3.up.railway.app
- **Backend API**: https://bff-production-[id].up.railway.app/api

## Testing the Login

1. Navigate to the frontend URL
2. Use any of the test credentials above
3. Enter any password (e.g., "password123")
4. You'll be redirected to the dashboard based on your role