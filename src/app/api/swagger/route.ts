import { createSwaggerSpec } from 'next-swagger-doc';

export async function GET() {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'RedMansion API',
        version: '1.0.0',
        description: 'RedMansion 小说托管服务 API 文档',
      },
      servers: [
        {
          url: 'http://localhost:9000',
          description: '开发服务器',
        },
      ],
      tags: [
        { name: 'novels', description: '小说相关接口' },
        { name: 'chapters', description: '章节相关接口' },
        { name: 'ipfs', description: 'IPFS相关接口' },
      ],
    },
  });

  return Response.json(spec);
}

