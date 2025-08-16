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
    this.logger.log(`Validating JWT payload for user: ${payload.sub}`);
    this.logger.debug(`JWT payload: ${JSON.stringify(payload)}`);
    
    const user = await this.authService.validateUserById(payload.sub);
    
    if (!user) {
      this.logger.warn(`User not found for ID: ${payload.sub}`);
      throw new UnauthorizedException('User not found');
    }

    this.logger.log(`User validated successfully: ${user.email}`);
    return user;
  }
}