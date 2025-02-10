# **Prisma Query Decorator for NestJS**

This library provides a powerful and configurable **PrismaQuery** decorator for NestJS that allows dynamic query parsing for REST endpoints using Prisma ORM.

## **📌 Features**

✅ **Configurable global settings** (`sensitiveFields`, `excludeKeys`, `forbiddenKeys`, `requestFields`)
✅ **Automatically includes request-based fields (e.g., `userId`, `accountId`)**
✅ **Supports filtering, ordering, and relations**
✅ **Validation using DTOs**
✅ **Paginator for findMany requests**
✅ **Generate OpenApi (Swagger) docs**

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

Additionally you can import the `usePrismaQueryExceptionFilter` to enhance the exception logging.
You can use the the exception filter besides the PrismaClientExceptionFilter from `nestjs-prisma`.

### **Example Configuration**

`main.ts`

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  PrismaQueryService,
  usePrismaQueryExceptionFilter,
} from '@stickelinnovation/nestjs-prisma-query';
// import { PrismaClientExceptionFilter } from 'nestjs-prisma';

async function bootstrap() {
  PrismaQueryService.configure({
    sensitiveFields: ['password', 'ssn'], // Prevents filtering/sorting by these fields
    excludeKeys: ['internalNotes'], // Keys that will be removed from the query
    requestFields: ['userId', 'accountId'], // Automatically added to Prisma `where` clause
  });

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  // app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  usePrismaQueryExceptionFilter(app); // Prisma Query Exception Filter
}

bootstrap();
```

---

## **📚 Usage in Controllers**

### **Basic Example**

Use the `PrismaQuery` decorator in your controller to parse Prisma queries dynamically.

```ts
import { Controller, Get } from '@nestjs/common';
import { PrismaQuery } from '@stickelinnovation/nestjs-prisma-query';
import { MyDto } from './dto/my.dto';
import { MyService } from './my.service';

@Controller('endpoint')
export class ItemController {
  constructor(private readonly myService: MyService) {}

  @Get()
  async getEndpoint(@PrismaQuery({ dto: MyDto, fieldTypeMap: {} }) prismaArgs) {
    return this.myService.findMany(prismaArgs);
  }
}
```

---

## **📌 Config Options Explained**

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
GET /endpoint?filter.password=1234
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
GET /endpoint?internalNotes=something&name=Item1
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
GET /endpoint?revalidate=true
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
GET /endpoint?category=books
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
import { Prisma } from '@prisma/client';
import {
  applySwaggerProperties,
  PrismaQueryDto,
} from '@stickelinnovation/nestjs-prisma-query';
import { favoriteFieldTypeMap } from 'src/favorites/entities/favorite.entity';

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
import { generateFieldTypeMap } from '@stickelinnovation/nestjs-prisma-query';

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
import { PrismaQuery } from '@stickelinnovation/nestjs-prisma-query';

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
      forbiddenKeys: [], //optional
      sensitiveFields: ['userId'], //optional
      excludeKeys: ['revalidate'], //optional
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
import { paginate } from '@stickelinnovation/nestjs-prisma-query';

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

## **🎯 Config Options Use Cases**

| Feature             | Use Case                                                           |
| ------------------- | ------------------------------------------------------------------ |
| **sensitiveFields** | Prevents exposing or filtering fields like `password`, `ssn`       |
| **excludeKeys**     | Removes unnecessary fields like `internalNotes`, `metaData`        |
| **forbiddenKeys**   | Blocks harmful query parameters like `revalidate`, `debugMode`     |
| **requestFields**   | Ensures `userId`, `accountId` are **always** included in filtering |

## **📌 Query Operators Explained**

`GET /endpoint?filter.[fieldName]=[value]&filter.[fieldName]$[operator]:[value]`

### **Filtering (`where`)**

The `filter` parameter allows you to dynamically apply Prisma `where` conditions.

#### **Example:**

```sh
GET /endpoint?filter.category=electronics&filter.price$gte:100
```

**Prisma equivalent:**

```ts
where: {
  category: 'electronics',
  price: { gte: 100 },
}
```

**Supported Operators:**

| Operator      | Description                | Example Usage                      |
| ------------- | -------------------------- | ---------------------------------- |
| `$eq`         | Equals                     | `filter.videoCrn=$eq:123`          |
| `$ne`         | Not equals                 | `filter.videoCrn=$ne:123`          |
| `$lt`         | Less than                  | `filter.createdAt=$lt:2024-01-01`  |
| `$lte`        | Less than or equal to      | `filter.createdAt=$lte:2024-01-01` |
| `$gt`         | Greater than               | `filter.createdAt=$gt:2024-01-01`  |
| `$gte`        | Greater than or equal to   | `filter.createdAt=$gte:2024-01-01` |
| `$contains`   | Contains (for text search) | `filter.name=$contains:demo`       |
| `$startsWith` | Starts with                | `filter.name=$startsWith:demo`     |
| `$endsWith`   | Ends with                  | `filter.name=$endsWith:demo`       |
| `$in`         | In a list of values        | `filter.videoCrn=$in:123,456`      |
| `$notIn`      | Not in a list of values    | `filter.videoCrn=$notIn:123,456`   |

You can also combine operators with logical operators, such as AND, OR, and NOT.

**Logical AND**

`$AND=filter.{filterName}=$endsWith:{filterValue}|filter.{filterName}=$endsWith:{filterValue}`

**Logical OR**

`$OR=filter.{filterName}=$endsWith:{filterValue}|filter.{filterName}=$endsWith:{filterValue}`

**Logical NOT**
`$NOT=filter.{filterName}=$endsWith:{filterValue}`

---

### **Sorting (`orderBy`)**

The `orderBy` parameter allows sorting results.

#### **Example:**

```sh
GET /endpoint?orderBy=price:asc&orderBy=createdAt:desc
```

**Prisma equivalent:**

```ts
orderBy: [{ price: 'asc' }, { createdAt: 'desc' }];
```

---

### **Pagination (`take`, `skip`)**

Pagination allows limiting results and fetching subsequent pages.

#### **Example:**

```sh
GET /endpoint?take=10&skip=20
```

**Prisma equivalent:**

```ts
take: 10,
skip: 20
```

---

### **Relations (`include`, `select`)**

You can include or select related models.

#### **Example:**

```sh
GET /endpoint?include=category,genre&select=name
```

**Prisma equivalent:**

```ts
include: { category: true, genre: true },
select: { name: true }
```

### **Distinct (`distinct`)**

You can specify which fields should be distinct.

#### **Example:**

```sh
GET /endpoint?distinct=name
```

**Prisma equivalent:**

```ts
distinct: ['name'];
```

---

## **🐟 License**

MIT License © 2025 - Stickel Innovation UG (Jonas Stickel)

---
