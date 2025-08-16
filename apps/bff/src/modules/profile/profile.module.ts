import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { AuditModule } from '../../shared/audit/audit.module';
import { StorageModule } from '../../shared/storage/storage.module';
import { profilePhotoConfig, idDocumentConfig } from './config/multer.config';

@Module({
  imports: [
    AuditModule,
    StorageModule,
    MulterModule.register({
      // Default config, specific configs are used in controllers
      dest: './uploads',
    }),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}