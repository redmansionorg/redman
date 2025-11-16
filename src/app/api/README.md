# RedMansion API Routes

Next.js API Routes 提供小说托管、IPFS上传和章节内容存储功能。

## 功能特性

- ✅ 小说元数据同步（从链上同步到数据库）
- ✅ IPFS上传服务（通过Filebase）
- ✅ 章节内容存储和管理
- ✅ 付费章节访问控制

## API端点

### 小说相关

#### 同步小说元数据
```http
POST /api/novels/sync/:contract_address
```

同步指定合约地址的小说元数据到数据库。

**示例**:
```bash
curl -X POST http://localhost:9000/api/novels/sync/0xc185d7ecB31ab5752A3C74C3E973A363228B02bb
```

**响应**:
```json
{
  "success": true,
  "message": "Novel synced successfully",
  "data": {
    "contract_address": "0x1234...",
    "novel_id": 1,
    "title": "小说标题",
    "chapter_count": 10,
    "chapters_synced": 10,
    "synced_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 获取小说详情
```http
GET http://localhost:9000/api/novels/0xc185d7ecB31ab5752A3C74C3E973A363228B02bb
```

#### 获取小说列表
```http
GET http://localhost:9000/api/novels?page=1&limit=20&author=0x2d44f6abc0ad19ba5ea0cac0595f2f7410c80106
```

### IPFS相关

#### 上传文件到IPFS
```http
POST /api/ipfs/upload
Content-Type: multipart/form-data
```

**示例**:
```bash
curl -X POST http://localhost:9000/api/ipfs/upload \
  -F "file=@image.jpg" \
  -F "type=image"
```

#### 上传文本到IPFS
```http
POST /api/ipfs/upload/text
Content-Type: application/json

{
  "content": "文本内容",
  "key": "custom/key.txt"
}
```

#### 验证CID
```http
GET /api/ipfs/:cid
```

### 章节相关

#### 获取章节内容
```http
GET /api/chapters/:contract_address/:chapter_number?address=0x...
```

**参数说明**:
- `contract_address`: 小说合约地址
- `chapter_number`: 章节编号
- `address` (可选): 用户钱包地址（访问付费章节时需要）

#### 获取章节列表
```http
GET /api/chapters/:contract_address
```

## 环境变量

在项目根目录的 `.env.local` 文件中配置：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=redmansion
DB_USER=postgres
DB_PASSWORD=your_password_here

# Web3配置
RPC_URL=https://redmansion.io/srpc
NEXT_PUBLIC_RPC=https://redmansion.io/srpc
IPFS_GATEWAY=https://ipfs.io/ipfs/
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/

# Filebase (IPFS) 配置
FILEBASE_ENDPOINT=https://s3.filebase.com
FILEBASE_REGION=us-east-1
FILEBASE_ACCESS_KEY_ID=your_access_key_id
FILEBASE_SECRET_ACCESS_KEY=your_secret_access_key
FILEBASE_BUCKET=redmansion
```

## 使用方式

### 开发模式

```bash
pnpm dev
```

前端和后端API都会在 `http://localhost:9000` 启动。

### 生产模式

```bash
pnpm build
pnpm start
```

## 注意事项

1. **合约地址验证**: 所有合约地址都会被转换为小写存储
2. **付费章节**: 访问付费章节需要提供用户钱包地址进行验证
3. **IPFS CID**: 上传到Filebase后会自动返回CID
4. **数据同步**: 链上数据是唯一真实来源，数据库作为缓存层
5. **数据库连接**: 使用连接池管理，避免频繁创建连接

## 项目结构

```
src/app/api/
├── novels/
│   ├── sync/
│   │   └── [contract_address]/
│   │       └── route.ts          # POST /api/novels/sync/:contract_address
│   ├── [contract_address]/
│   │   └── route.ts               # GET /api/novels/:contract_address
│   └── route.ts                   # GET /api/novels
├── ipfs/
│   ├── upload/
│   │   ├── text/
│   │   │   └── route.ts           # POST /api/ipfs/upload/text
│   │   └── route.ts               # POST /api/ipfs/upload
│   └── [cid]/
│       └── route.ts               # GET /api/ipfs/:cid
└── chapters/
    └── [contract_address]/
        ├── [chapter_number]/
        │   └── route.ts           # GET /api/chapters/:contract_address/:chapter_number
        └── route.ts               # GET /api/chapters/:contract_address

src/lib/api/
├── db.ts                          # 数据库连接和查询函数
├── web3.ts                        # Web3工具函数
└── ipfs.ts                        # IPFS上传工具函数
```

