import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationEmailService } from './email/invitation-email.service';
import { DatabaseModule } from '../../shared/database/database.module';
import { AuditModule } from '../../shared/audit/audit.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuditModule,
  ],
  controllers: [InvitationsController],
  providers: [
    InvitationsService,
    InvitationEmailService,
  ],
  exports: [
    InvitationsService,
    InvitationEmailService,
  ],
})
export class InvitationsModule {}