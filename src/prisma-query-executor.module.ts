import { Global, Module } from '@nestjs/common';

import { PrismaQueryExecutorService } from './prisma-query-executor.service';

@Global()
@Module({
  providers: [PrismaQueryExecutorService],
  exports: [PrismaQueryExecutorService],
})
export class PrismaQueryExecutorModule {}
