import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production';
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });

    this.logger.log(`JWT Strategy initialized with secret: ${jwtSecret.substring(0, 10)}...`);
  }

  async validate(payload: JwtPayload) {
    this.logger.log(`🔐 Validating JWT for user: ${payload.sub}`);
    
    try {
      const user = await this.authService.validateUserById(payload.sub);
      
      if (!user) {
        // Enhanced error logging for diagnostics
        this.logger.error(`❌ JWT validation failed - User not found: ${payload.sub}`);
        this.logger.error(`📍 Possible causes:`);
        this.logger.error(`   1. User deleted but JWT still valid (token issued: ${payload.iat ? new Date(payload.iat * 1000).toISOString() : 'unknown'})`);
        this.logger.error(`   2. Invalid user ID in JWT token`);
        this.logger.error(`   3. Database connectivity issue`);
        
        // Log additional context for debugging (without exposing sensitive data)
        this.logger.error(`🔍 Token details: issued=${payload.iat ? new Date(payload.iat * 1000).toISOString() : 'unknown'}, expires=${payload.exp ? new Date(payload.exp * 1000).toISOString() : 'unknown'}`);
        
        throw new UnauthorizedException({
          message: 'Authentication failed',
          code: 'USER_NOT_FOUND',
          details: 'Your session may have expired. Please log in again.'
        });
      }

      // Additional validation: check if user account is active
      if (user.deletedAt) {
        this.logger.warn(`⚠️ Soft-deleted user attempted access: ${user.email}`);
        throw new UnauthorizedException({
          message: 'Account deactivated',
          code: 'ACCOUNT_DEACTIVATED',
          details: 'This account has been deactivated. Please contact support.'
        });
      }

      this.logger.log(`✅ JWT validated successfully: ${user.email} (${user.firstName} ${user.lastName})`);
      
      // Return an enriched user object that includes JWT payload fields
      // This ensures the TenantInterceptor can access both JWT fields and User data
      return {
        ...user,
        // JWT payload fields for TenantInterceptor
        sub: payload.sub,
        email: payload.email || user.email,
        role: payload.role || user.role,
        organizationId: payload.organizationId || user.organizationId,
        propertyId: payload.propertyId || user.propertyId,
        departmentId: payload.departmentId || user.departmentId,
        permissions: payload.permissions || [],
        // JWT metadata
        iat: payload.iat,
        exp: payload.exp,
        nbf: payload.nbf,
        aud: payload.aud,
        iss: payload.iss,
        jti: payload.jti,
      };
      
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error; // Re-throw our custom unauthorized errors
      }
      
      // Handle unexpected errors (database connection, etc.)
      this.logger.error(`🚫 Unexpected error during JWT validation for user ${payload.sub}:`, error);
      throw new UnauthorizedException({
        message: 'Authentication service temporarily unavailable',
        code: 'AUTH_SERVICE_ERROR',
        details: 'Please try again in a moment.'
      });
    }
  }
}