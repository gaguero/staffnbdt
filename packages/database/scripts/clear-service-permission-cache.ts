import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../apps/bff/src/app.module';
import { PermissionService } from '../../../apps/bff/src/shared/services/permission.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function clearServicePermissionCache() {
  console.log('🧹 Clearing PermissionService internal cache...');
  
  try {
    const app = await NestFactory.create(AppModule, { logger: false });
    const permissionService = app.get(PermissionService);
    
    const userId = 'cmf0gg0wn000elzp5l9dzkzs1';
    console.log(`👤 User ID: ${userId}`);
    
    // Clear the internal permission cache for this user
    permissionService.clearUserPermissionCache(userId);
    
    console.log('✅ PermissionService cache cleared successfully');
    console.log('🔄 User will get fresh permissions on next API call');
    
    await app.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearServicePermissionCache().catch(console.error);