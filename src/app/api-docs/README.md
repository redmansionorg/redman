# API 文档使用说明

## 访问文档

启动开发服务器后，访问：
```
http://localhost:9000/api-docs
```

## 如何添加 API 文档

在 API 路由文件中添加 `@swagger` JSDoc 注释即可。

### 示例

```typescript
/**
 * @swagger
 * /api/novels:
 *   get:
 *     tags: [novels]
 *     summary: 获取小说列表
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: 成功
 */
export async function GET(request: NextRequest) {
  // 你的代码
}
```

## 使用 Cursor 生成代码

1. 先写 `@swagger` 注释（定义 API）
2. 告诉 Cursor："根据这个 @swagger 注释，生成完整的函数实现"
3. Cursor 会根据注释生成代码

## 测试 API

在 Swagger UI 页面中：
1. 找到要测试的 API
2. 点击 "Try it out"
3. 填写参数
4. 点击 "Execute"
5. 查看响应结果

## 更多信息

- OpenAPI 规范文档：https://swagger.io/specification/
- next-swagger-doc 文档：https://github.com/luoyjx/next-swagger-doc

