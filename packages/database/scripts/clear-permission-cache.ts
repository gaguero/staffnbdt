import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const railwayDatabaseUrl = process.env.DATABASE_URL;
if (!railwayDatabaseUrl) {
  console.error('❌ DATABASE_URL environment variable not found');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: railwayDatabaseUrl
    }
  }
});

async function clearPermissionCache() {
  console.log('🧹 Clearing permission cache...');
  
  try {
    // This will trigger cache invalidation when the user makes their next API call
    const userId = 'cmf0gg0wn000elzp5l9dzkzs1';
    
    console.log(`👤 User ID: ${userId}`);
    
    // Force update the user record to invalidate any cached tokens
    await prisma.user.update({
      where: { id: userId },
      data: {
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Permission cache cleared successfully');
    console.log('🔄 User will get fresh permissions on next API call');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearPermissionCache().catch(console.error);