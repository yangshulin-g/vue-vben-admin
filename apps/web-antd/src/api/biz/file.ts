import { requestClient } from '#/api/request';

export type BizFileType = 'avatar' | 'product' | 'voucher';

export async function uploadFileApi(
  file: Blob | File,
  type: BizFileType = 'product',
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  return requestClient.post<{ url: string }>('/api/v1/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export async function deleteFileApi(url: string) {
  return requestClient.post<{ success?: boolean }>('/api/v1/file/delete', {
    url,
  });
}
