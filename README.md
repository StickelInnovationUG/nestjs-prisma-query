# **Prisma Query Decorator for NestJS**

This library provides a powerful and configurable **PrismaQuery** decorator for NestJS that allows dynamic query parsing for Prisma ORM.

## **📌 Features**

✅ **Configurable global settings** (`sensitiveFields`, `excludeKeys`, `forbiddenKeys`, `requestFields`)  
✅ **Automatically includes request-based fields (e.g., `userId`, `accountId`)**  
✅ **Supports filtering, ordering, and relations**  
✅ **Validation using DTOs**
✅ **Paginator for findMany requests**

---

## **🚀 Installation**

```sh
npm install prisma-query-decorator
# or
pnpm add prisma-query-decorator
# or
yarn add prisma-query-decorator
```

## **📁 Peer Dependencies**

Ensure you have the following peer dependencies installed:

- `@nestjs/common`
- `@nestjs/core`
- `@prisma/client`

---

## **🛠️ Configuration**

You can configure the query service globally in your `main.ts` file before starting your NestJS application.

### **Example Configuration**

`main.ts`

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaQueryService } from 'prisma-query-decorator';

async function bootstrap() {
  PrismaQueryService.configure({
    sensitiveFields: ['password', 'ssn'], // Prevents filtering/sorting by these fields
    excludeKeys: ['internalNotes'], // Keys that will be removed from the query
    requestFields: ['userId', 'accountId'], // Automatically added to Prisma `where` clause
  });

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
```

---

## **📚 Usage in Controllers**

### **Basic Example**

Use the `PrismaQuery` decorator in your controller to parse Prisma queries dynamically.

```ts
import { Controller, Get } from '@nestjs/common';
import { PrismaQuery } from 'prisma-query-decorator';
import { MyDto } from './dto/my.dto';
import { MyService } from './my.service';

@Controller('items')
export class ItemController {
  constructor(private readonly myService: MyService) {}

  @Get()
  async getItems(@PrismaQuery({ dto: MyDto, fieldTypeMap: {} }) prismaArgs) {
    return this.myService.findMany(prismaArgs);
  }
}
```

---

## **📌 Options Explained**

### **👉 `sensitiveFields`**

Sensitive fields **cannot** be used in filters (`where`) or sorting (`orderBy`).  
Example:

```ts
PrismaQueryService.configure({
  sensitiveFields: ['password', 'apiKey'],
});
```

#### **🚫 Blocked Example:**

```sh
GET /items?filter.password=1234
```

This request will return an error because `password` is a sensitive field.

---

### **👉 `excludeKeys`**

These keys will be **removed from the query** before processing.  
Example:

```ts
PrismaQueryService.configure({
  excludeKeys: ['internalNotes'],
});
```

#### **❌ Removed Example:**

```sh
GET /items?internalNotes=something&name=Item1
```

- The query `{ internalNotes: 'something', name: 'Item1' }`
- Becomes `{ name: 'Item1' }` (internalNotes is **excluded**)

---

### **👉 `forbiddenKeys`**

Forbidden keys **cannot be present** in the query at all. If found, an error is thrown.  
Example:

```ts
PrismaQueryService.configure({
  forbiddenKeys: ['revalidate'],
});
```

#### **🚫 Blocked Example:**

```sh
GET /items?revalidate=true
```

This request will return an **error** because `revalidate` is forbidden.

---

### **👉 `requestFields`**

Fields that are **automatically added** to the `where` clause from the request object.  
Example:

```ts
PrismaQueryService.configure({
  requestFields: ['userId', 'accountId'],
});
```

#### **✅ Automatic Filtering**

If the request contains `userId=5`:

```sh
GET /items?category=books
```

This will **automatically** transform into:

```ts
where: {
  category: 'books',
  userId: 5,  // Auto-added from request
}
```

---

## **📞 Full Example with Prisma Service**

### **DTO / Entity for Validation**

```ts
export class LikeQueryDto extends PrismaQueryDto<Prisma.LikeFindManyArgs> {
  constructor() {
    super();
  }

  static applySwaggerProperties() {
    applySwaggerProperties(LikeQueryDto, likeFieldTypeMap);
  }
}

LikeQueryDto.applySwaggerProperties();
```

```ts
export class LikeEntity {
  id: number;
  createdAt: Date;
  video?: VideoEntity;
  serie?: SerieEntity;

  constructor() {
    this.id = 0;
    this.createdAt = new Date();
    this.video = new VideoEntity();
    this.serie = new SerieEntity();
  }
}

export const likeFieldTypeMap = generateFieldTypeMap(LikeEntity);
```

### **Controller**

```ts
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Get('video')
  @ApiOperation({ summary: 'Get all video like entries' })
  @ApiOkResponse({ type: PaginationResultDto<LikeEntity>, isArray: false })
  @ApiQuery({ type: LikeQueryDto })
  @ApiQuery({
    name: 'revalidate',
    required: false,
    type: Boolean,
    example: false,
  })
  findAllVideoLikes(
    @PrismaQuery({
      fieldTypeMap: likeFieldTypeMap,
      dto: LikeQueryDto,
      forbiddenKeys: [],
      sensitiveFields: ['userId'],
      excludeKeys: ['revalidate'],
    })
    query: Prisma.LikeFindManyArgs,
    @Query('revalidate', new DefaultValuePipe(true), ParseBoolPipe)
    revalidate: boolean = true,
  ) {
    return this.likesService.findAllVideoLikes(query, revalidate);
  }
}
```

### **Service**

```ts
async findAllVideoLikes(
    query: Prisma.LikeFindManyArgs,
  ) {
    try {
      const likes = await paginate(this.prisma.like, {
        ...query,
      });

      return likes;
    } catch (error) {
      handlePrismaError(error);
    }
  }
```

---

## **🎯 Use Cases**

| Feature             | Use Case                                                           |
| ------------------- | ------------------------------------------------------------------ |
| **sensitiveFields** | Prevents exposing or filtering fields like `password`, `ssn`       |
| **excludeKeys**     | Removes unnecessary fields like `internalNotes`, `metaData`        |
| **forbiddenKeys**   | Blocks harmful query parameters like `revalidate`, `debugMode`     |
| **requestFields**   | Ensures `userId`, `accountId` are **always** included in filtering |

---

## **🐟 License**

MIT License © 2025 - Stickel Innovation UG (Jonas Stickel)

---
