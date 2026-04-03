<script lang="ts" setup>
import { computed, ref } from 'vue';

import { Button, message, Space, Upload } from 'ant-design-vue';

import { uploadFileApi } from '#/api';

interface Props {
  buttonText?: string;
  disabled?: boolean;
  modelValue?: string;
  type?: 'avatar' | 'product' | 'voucher';
}

const props = withDefaults(defineProps<Props>(), {
  buttonText: '上传图片',
  disabled: false,
  modelValue: '',
  type: 'product',
});

const emit = defineEmits<{
  success: [url: string];
  'update:modelValue': [value: string];
}>();

const uploading = ref(false);

const previewUrl = computed(() => props.modelValue || '');

async function handleCustomRequest(options: any) {
  uploading.value = true;
  try {
    const file = options.file as File;
    const res = await uploadFileApi(file, props.type);
    emit('update:modelValue', res.url);
    emit('success', res.url);
    options.onSuccess?.(res);
    message.success('图片上传成功');
  } catch (error: any) {
    options.onError?.(error);
    message.error(error?.message || '图片上传失败');
  } finally {
    uploading.value = false;
  }
}

function clearImage() {
  emit('update:modelValue', '');
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-if="previewUrl"
      class="flex h-28 w-28 items-center justify-center overflow-hidden rounded border border-dashed border-gray-300 bg-gray-50"
    >
      <img
        :src="previewUrl"
        alt="uploaded"
        class="h-full w-full object-cover"
      />
    </div>
    <Space wrap>
      <Upload
        accept="image/*"
        :custom-request="handleCustomRequest"
        :disabled="disabled"
        :show-upload-list="false"
      >
        <Button :disabled="disabled" :loading="uploading" type="dashed">
          {{ uploading ? '上传中...' : buttonText }}
        </Button>
      </Upload>
      <Button v-if="previewUrl" danger type="link" @click="clearImage">
        清空
      </Button>
    </Space>
    <div v-if="previewUrl" class="break-all text-xs text-gray-500">
      {{ previewUrl }}
    </div>
  </div>
</template>
