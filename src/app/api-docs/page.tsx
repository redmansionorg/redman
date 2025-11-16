'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/swagger')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load API spec');
        }
        return res.json();
      })
      .then((data) => {
        setSpec(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">加载 API 文档中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">错误: {error}</div>
      </div>
    );
  }

  if (!spec) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <SwaggerUI 
        spec={spec}
        tryItOutEnabled={true}
        supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
        requestInterceptor={(request) => {
          // 可以在这里添加认证token等
          return request;
        }}
      />
    </div>
  );
}

