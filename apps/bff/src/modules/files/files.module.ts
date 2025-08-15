import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { StorageService } from '../../shared/storage/storage.service';
import { PrismaService } from '../../shared/database/prisma.service';

@Module({
  controllers: [FilesController],
  providers: [FilesService, StorageService, PrismaService],
  exports: [FilesService],
})
export class FilesModule {}