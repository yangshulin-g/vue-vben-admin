<script lang="ts" setup>
import type {
  ProductDetailRes,
  ProductImageItem,
  ProductListItem,
} from '#/api';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  addProductImageApi,
  createProductApi,
  getCategoryListApi,
  getProductDetailApi,
  getProductListApi,
  removeProductImageApi,
  setMainProductImageApi,
  sortProductImageApi,
  updateProductApi,
  updateProductStatusApi,
} from '#/api';
import BizImageUpload from '#/components/biz-upload/BizImageUpload.vue';

defineOptions({ name: 'ProductListPage' });

const accessStore = useAccessStore();
const loading = ref(false);
const detailLoading = ref(false);
const createLoading = ref(false);
const editLoading = ref(false);
const imageActionLoading = ref(false);
const dataSource = ref<ProductListItem[]>([]);
const total = ref(0);
const categoryOptions = ref<Array<{ label: string; value: number }>>([]);
const detailOpen = ref(false);
const detailData = ref<null | ProductDetailRes>(null);
const createOpen = ref(false);
const editOpen = ref(false);
const editActiveTab = ref('basic');
const specOpen = ref(false);
const specTargetMode = ref<'create' | 'edit'>('create');
const specTargetSkuKey = ref('');
const galleryUploadValue = ref('');
const editImages = ref<ProductImageItem[]>([]);
const skuImagePickerOpen = ref(false);
const skuImagePickerTargetMode = ref<'create' | 'edit'>('edit');
const skuImagePickerTargetKey = ref('');

const filters = reactive({
  categoryId: undefined as number | undefined,
  productName: '',
  status: undefined as 'DRAFT' | 'OFF_SHELF' | 'ON_SHELF' | undefined,
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

interface ProductSkuFormItem {
  price: number;
  skuCode: string;
  skuImage: string;
  skuId?: number;
  specificationItems: Array<{ key: string; tempKey: string; value: string }>;
  stock: number;
  tempKey: string;
}

const createForm = reactive({
  categoryId: undefined as number | undefined,
  description: '',
  mainImage: '',
  productCode: '',
  productName: '',
  skuList: [] as ProductSkuFormItem[],
  unit: '件',
});

const editForm = reactive({
  categoryId: undefined as number | undefined,
  description: '',
  mainImage: '',
  productCode: '',
  productId: undefined as number | undefined,
  productName: '',
  skuList: [] as ProductSkuFormItem[],
  unit: '件',
});

const statusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '上架', value: 'ON_SHELF' },
  { label: '下架', value: 'OFF_SHELF' },
];

const statusColorMap: Record<'DRAFT' | 'OFF_SHELF' | 'ON_SHELF', string> = {
  DRAFT: 'default',
  OFF_SHELF: 'warning',
  ON_SHELF: 'success',
};

const statusTextMap: Record<'DRAFT' | 'OFF_SHELF' | 'ON_SHELF', string> = {
  DRAFT: '草稿',
  OFF_SHELF: '下架',
  ON_SHELF: '上架',
};

const canCreate = () => accessStore.accessCodes.includes('product:create');
const canUpdate = () => accessStore.accessCodes.includes('product:update');
const canUpdateStatus = () =>
  accessStore.accessCodes.includes('product:status:update');
const canAddImage = () => accessStore.accessCodes.includes('product:image:add');
const canRemoveImage = () =>
  accessStore.accessCodes.includes('product:image:remove');
const canSortImage = () =>
  accessStore.accessCodes.includes('product:image:sort');
const canSetMainImage = () =>
  accessStore.accessCodes.includes('product:image:main');

const skuColumns = [
  { dataIndex: 'skuCode', key: 'skuCode', title: 'SKU编码' },
  { dataIndex: 'price', key: 'price', title: '价格' },
  { dataIndex: 'stock', key: 'stock', title: '库存' },
  { key: 'skuImage', title: 'SKU图片', width: 240 },
  { key: 'specification', title: '规格' },
  { key: 'actions', title: '操作', width: 140 },
];

const detailSkuColumns = [
  { dataIndex: 'skuCode', key: 'skuCode', title: 'SKU编码' },
  { dataIndex: 'price', key: 'price', title: '价格' },
  { dataIndex: 'stock', key: 'stock', title: '库存' },
  { key: 'skuImage', title: 'SKU图片', width: 120 },
  { dataIndex: 'specification', key: 'specification', title: '规格' },
];

const columns = [
  { dataIndex: 'productCode', key: 'productCode', title: '商品编码' },
  { dataIndex: 'productName', key: 'productName', title: '商品名称' },
  {
    dataIndex: ['category', 'categoryName'],
    key: 'categoryName',
    title: '分类',
  },
  { dataIndex: 'status', key: 'status', title: '状态' },
  { key: 'skuCount', title: 'SKU数' },
  { key: 'priceRange', title: '价格区间' },
  { key: 'stockTotal', title: '总库存' },
  { key: 'actions', title: '操作', width: 240 },
];

function formatSkuPriceRange(item: ProductListItem) {
  const prices = (item.skuList ?? [])
    .map((sku) => Number(sku.price ?? 0))
    .filter((price) => !Number.isNaN(price));
  if (prices.length === 0) {
    return '-';
  }
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `${min}` : `${min} ~ ${max}`;
}

function calcTotalStock(item: ProductListItem) {
  return (item.skuList ?? []).reduce((sum, sku) => sum + (sku.stock ?? 0), 0);
}

function createEmptySku(stock = 0): ProductSkuFormItem {
  return {
    price: 0,
    skuCode: '',
    skuImage: '',
    specificationItems: [],
    stock,
    tempKey: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}

function cloneSpecificationItems(
  items: Array<{ key: string; tempKey: string; value: string }> = [],
) {
  return items.map((item) => ({
    key: item.key,
    tempKey: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    value: item.value,
  }));
}

function addCreateSku() {
  const previous = createForm.skuList[createForm.skuList.length - 1];
  const next = createEmptySku(100);
  if (previous) {
    next.specificationItems = cloneSpecificationItems(
      previous.specificationItems,
    );
  }
  createForm.skuList.push(next);
}

function addEditSku() {
  const previous = editForm.skuList[editForm.skuList.length - 1];
  const next = createEmptySku(0);
  if (previous) {
    next.specificationItems = cloneSpecificationItems(
      previous.specificationItems,
    );
  }
  editForm.skuList.push(next);
}

function removeCreateSku(tempKey: string) {
  if (createForm.skuList.length <= 1) {
    message.warning('至少保留一个SKU');
    return;
  }
  createForm.skuList = createForm.skuList.filter(
    (item) => item.tempKey !== tempKey,
  );
}

function removeEditSku(tempKey: string) {
  if (editForm.skuList.length <= 1) {
    message.warning('至少保留一个SKU');
    return;
  }
  editForm.skuList = editForm.skuList.filter(
    (item) => item.tempKey !== tempKey,
  );
}

function copySpecFromPrevious(mode: 'create' | 'edit', index: number) {
  if (index <= 0) return;
  const skuList = getSkuListByMode(mode);
  const current = skuList[index];
  const previous = skuList[index - 1];
  if (!current || !previous) return;
  current.specificationItems = cloneSpecificationItems(
    previous.specificationItems,
  );
  message.success('已复制上一个SKU规格');
}

function normalizeSpecificationObject(obj: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== null && v !== undefined && `${v}`.trim() !== '') {
      result[k] = v;
    }
  });
  return result;
}

function itemsToSpecificationObject(
  items: Array<{ key: string; value: string }>,
) {
  const result: Record<string, unknown> = {};
  items.forEach((item) => {
    const key = item.key.trim();
    const value = item.value.trim();
    if (key && value) {
      result[key] = value;
    }
  });
  const normalized = normalizeSpecificationObject(result);
  if (Object.keys(normalized).length === 0) return undefined;
  return normalized;
}

function specificationToItems(specification: any) {
  if (!specification)
    return [] as Array<{ key: string; tempKey: string; value: string }>;
  let obj: null | Record<string, unknown> = null;
  if (typeof specification === 'string') {
    try {
      const parsed = JSON.parse(specification);
      if (typeof parsed === 'object' && parsed && !Array.isArray(parsed))
        obj = parsed;
    } catch {
      return [];
    }
  } else if (
    typeof specification === 'object' &&
    !Array.isArray(specification)
  ) {
    obj = specification as Record<string, unknown>;
  }
  if (!obj) return [];
  const normalized = normalizeSpecificationObject(obj);
  return Object.entries(normalized).map(([key, value]) => ({
    key,
    tempKey: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    value: `${value}`,
  }));
}

function getSkuListByMode(mode: 'create' | 'edit') {
  return mode === 'create' ? createForm.skuList : editForm.skuList;
}

function findSkuByMode(mode: 'create' | 'edit', tempKey: string) {
  return getSkuListByMode(mode).find((item) => item.tempKey === tempKey);
}

function findTargetSku() {
  return findSkuByMode(specTargetMode.value, specTargetSkuKey.value);
}

function openSpecEditor(mode: 'create' | 'edit', sku: ProductSkuFormItem) {
  specTargetMode.value = mode;
  specTargetSkuKey.value = sku.tempKey;
  if (!sku.specificationItems) {
    sku.specificationItems = [];
  }
  specOpen.value = true;
}

function addSpecItem() {
  const target = findTargetSku();
  if (!target) return;
  target.specificationItems.push({
    key: '',
    tempKey: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    value: '',
  });
}

function removeSpecItem(tempKey: string) {
  const target = findTargetSku();
  if (!target) return;
  target.specificationItems = target.specificationItems.filter(
    (item) => item.tempKey !== tempKey,
  );
}

function renderSkuSpecPreview(sku: ProductSkuFormItem) {
  const specObj = itemsToSpecificationObject(sku.specificationItems || []);
  if (!specObj) return '-';
  return Object.entries(specObj)
    .map(([k, v]) => `${k}: ${v}`)
    .join('，');
}

function getGalleryMainImageUrl(images?: ProductImageItem[]) {
  return (
    normalizeImageList(images).find((image) => image.isMain)?.imageUrl || ''
  );
}

function setSkuImageValue(
  mode: 'create' | 'edit',
  tempKey: string,
  url: string,
) {
  const target = findSkuByMode(mode, tempKey);
  if (!target) return;
  target.skuImage = url;
}

function clearSkuImage(mode: 'create' | 'edit', tempKey: string) {
  setSkuImageValue(mode, tempKey, '');
}

function openSkuImagePicker(mode: 'create' | 'edit', sku: ProductSkuFormItem) {
  if (mode !== 'edit') return;
  if (editImages.value.length === 0) {
    message.warning('当前暂无商品相册图片，请先在相册管理中上传');
    return;
  }
  skuImagePickerTargetMode.value = mode;
  skuImagePickerTargetKey.value = sku.tempKey;
  skuImagePickerOpen.value = true;
}

function selectSkuImageFromGallery(url: string) {
  setSkuImageValue(
    skuImagePickerTargetMode.value,
    skuImagePickerTargetKey.value,
    url,
  );
  skuImagePickerOpen.value = false;
  message.success('SKU图片已更新');
}

async function handleEditMainImageUpload(url: string) {
  if (!editForm.productCode || !canAddImage()) {
    return;
  }
  imageActionLoading.value = true;
  try {
    await addProductImageApi({
      imageUrl: url,
      isMain: true,
      productCode: editForm.productCode,
    });
    await reloadEditImages();
    message.success('主图已同步到商品相册');
  } catch (error: any) {
    message.error(error?.message || '主图同步相册失败');
  } finally {
    imageActionLoading.value = false;
  }
}

function buildSkuPayload(skuList: ProductSkuFormItem[]) {
  const seen = new Set<string>();
  return skuList.map((sku, idx) => {
    const skuCode = sku.skuCode.trim();
    if (!skuCode) {
      throw new Error(`第${idx + 1}行SKU编码不能为空`);
    }
    if (seen.has(skuCode)) {
      throw new Error(`SKU编码重复：${skuCode}`);
    }
    seen.add(skuCode);
    if (sku.price < 0) {
      throw new Error(`第${idx + 1}行价格不能小于0`);
    }
    if (sku.stock < 0) {
      throw new Error(`第${idx + 1}行库存不能小于0`);
    }
    return {
      price: sku.price,
      skuCode,
      skuImage: sku.skuImage.trim() || undefined,
      skuId: sku.skuId,
      specification: itemsToSpecificationObject(sku.specificationItems || []),
      stock: sku.stock,
    };
  });
}

function formatSpecificationView(specification: any) {
  if (
    specification === null ||
    specification === undefined ||
    specification === ''
  )
    return '-';
  const items = specificationToItems(specification);
  if (items.length === 0) return '-';
  return items.map((item) => `${item.key}: ${item.value}`).join('，');
}

function normalizeImageList(images?: ProductImageItem[]) {
  return [...(images ?? [])].sort(
    (a, b) => Number(a.sort ?? 0) - Number(b.sort ?? 0),
  );
}

async function reloadEditImages() {
  if (!editForm.productId) return;
  const detail = await getProductDetailApi({ productId: editForm.productId });
  editImages.value = normalizeImageList(detail.images);
  editForm.mainImage =
    getGalleryMainImageUrl(detail.images) || detail.mainImage || '';
}

async function handleGalleryUpload(url: string) {
  if (!editForm.productCode) {
    message.warning('请先保存商品基础信息后再管理相册');
    galleryUploadValue.value = '';
    return;
  }
  imageActionLoading.value = true;
  try {
    await addProductImageApi({
      imageUrl: url,
      isMain: editImages.value.length === 0,
      productCode: editForm.productCode,
    });
    message.success('相册图片添加成功');
    await reloadEditImages();
  } finally {
    galleryUploadValue.value = '';
    imageActionLoading.value = false;
  }
}

async function saveImageSort(image: ProductImageItem) {
  if (!image.imageId) return;
  imageActionLoading.value = true;
  try {
    await sortProductImageApi({
      imageId: image.imageId,
      sort: Number(image.sort ?? 0),
    });
    message.success('图片排序更新成功');
    await reloadEditImages();
  } finally {
    imageActionLoading.value = false;
  }
}

async function setGalleryMainImage(image: ProductImageItem) {
  if (!image.imageId || !editForm.productCode) return;
  imageActionLoading.value = true;
  try {
    await setMainProductImageApi({
      imageId: image.imageId,
      productCode: editForm.productCode,
    });
    editForm.mainImage = image.imageUrl || '';
    message.success('主图设置成功');
    await reloadEditImages();
  } finally {
    imageActionLoading.value = false;
  }
}

async function removeGalleryImage(image: ProductImageItem) {
  if (!image.imageId) return;
  imageActionLoading.value = true;
  try {
    await removeProductImageApi({ imageId: image.imageId });
    message.success('图片删除成功');
    await reloadEditImages();
  } finally {
    imageActionLoading.value = false;
  }
}

async function loadCategoryOptions() {
  const res = await getCategoryListApi({ page: 1, size: 200 });
  categoryOptions.value = (res.list ?? []).map((item) => ({
    label: `${item.categoryName} (${item.categoryCode ?? '-'})`,
    value: item.id,
  }));
}

async function loadProductList() {
  loading.value = true;
  try {
    const res = await getProductListApi({
      categoryId: filters.categoryId,
      page: pagination.current,
      productName: filters.productName || undefined,
      size: pagination.pageSize,
      status: filters.status,
    });
    dataSource.value = res.list ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  pagination.current = 1;
  loadProductList();
}

function onReset() {
  filters.categoryId = undefined;
  filters.productName = '';
  filters.status = undefined;
  pagination.current = 1;
  loadProductList();
}

function onTableChange(page: number, pageSize: number) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  loadProductList();
}

async function openDetail(productId: number) {
  detailLoading.value = true;
  detailOpen.value = true;
  try {
    detailData.value = await getProductDetailApi({ productId });
  } finally {
    detailLoading.value = false;
  }
}

async function changeStatus(
  item: ProductListItem,
  status: 'DRAFT' | 'OFF_SHELF' | 'ON_SHELF',
) {
  await updateProductStatusApi({
    productId: item.id,
    status,
  });
  message.success('商品状态更新成功');
  await loadProductList();
}

function openCreate() {
  createForm.categoryId = undefined;
  createForm.description = '';
  createForm.mainImage = '';
  createForm.productCode = '';
  createForm.productName = '';
  createForm.unit = '件';
  createForm.skuList = [createEmptySku(100)];
  createOpen.value = true;
}

async function submitCreate() {
  if (
    !createForm.categoryId ||
    !createForm.productCode ||
    !createForm.productName
  ) {
    message.warning('请填写完整的商品信息');
    return;
  }
  createLoading.value = true;
  try {
    const skuPayload = buildSkuPayload(createForm.skuList).map(
      ({ skuId: _skuId, ...rest }) => rest,
    );
    await createProductApi({
      categoryId: createForm.categoryId,
      description: createForm.description || undefined,
      mainImage: createForm.mainImage,
      productCode: createForm.productCode,
      productName: createForm.productName,
      skuList: skuPayload,
      unit: createForm.unit,
    });
    message.success('新增商品成功');
    createOpen.value = false;
    await loadProductList();
  } catch (error: any) {
    message.error(error?.message || '商品创建失败');
  } finally {
    createLoading.value = false;
  }
}

async function openEdit(item: ProductListItem) {
  editLoading.value = true;
  editOpen.value = true;
  editActiveTab.value = 'basic';
  editImages.value = [];
  galleryUploadValue.value = '';
  skuImagePickerOpen.value = false;
  try {
    const detail = await getProductDetailApi({ productId: item.id });
    editForm.productId = detail.productId;
    editForm.productCode = detail.productCode || '';
    editForm.productName = detail.productName || '';
    editForm.description = detail.description || '';
    editForm.unit = detail.unit || '件';
    editForm.mainImage =
      getGalleryMainImageUrl(detail.images) || detail.mainImage || '';
    editForm.categoryId = detail.category?.categoryId;
    editForm.skuList = detail.skuList?.map((sku) => ({
      price: Number(sku.price || 0),
      skuCode: sku.skuCode || '',
      skuImage: sku.skuImage || '',
      skuId: sku.skuId,
      specificationItems: specificationToItems(sku.specification),
      stock: sku.stock || 0,
      tempKey: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    })) ?? [createEmptySku(0)];
    editImages.value = normalizeImageList(detail.images);
    if (editForm.skuList.length === 0) {
      editForm.skuList = [createEmptySku(0)];
    }
  } finally {
    editLoading.value = false;
  }
}

async function submitEdit() {
  if (
    !editForm.productId ||
    !editForm.categoryId ||
    !editForm.productCode ||
    !editForm.productName
  ) {
    message.warning('请填写完整的商品信息');
    return;
  }
  editLoading.value = true;
  try {
    const skuPayload = buildSkuPayload(editForm.skuList);
    const galleryMainImage = getGalleryMainImageUrl(editImages.value);
    await updateProductApi({
      categoryId: editForm.categoryId,
      description: editForm.description || undefined,
      mainImage: galleryMainImage || editForm.mainImage || undefined,
      productCode: editForm.productCode,
      productId: editForm.productId,
      productName: editForm.productName,
      skuList: skuPayload,
      unit: editForm.unit,
    });
    message.success('更新商品成功');
    editOpen.value = false;
    await loadProductList();
  } catch (error: any) {
    message.error(error?.message || '商品更新失败');
  } finally {
    editLoading.value = false;
  }
}

loadCategoryOptions();
loadProductList();
</script>

<template>
  <Page title="商品列表">
    <Card class="mb-4">
      <Form layout="inline">
        <Form.Item label="商品名称">
          <Input
            v-model:value="filters.productName"
            allow-clear
            placeholder="请输入商品名称"
          />
        </Form.Item>
        <Form.Item label="分类">
          <Select
            v-model:value="filters.categoryId"
            :options="categoryOptions"
            allow-clear
            placeholder="请选择分类"
            style="width: 220px"
          />
        </Form.Item>
        <Form.Item label="状态">
          <Select
            v-model:value="filters.status"
            :options="statusOptions"
            allow-clear
            placeholder="请选择状态"
            style="width: 180px"
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button v-if="canCreate()" type="dashed" @click="openCreate">
              新增商品
            </Button>
            <Button type="primary" @click="onSearch">查询</Button>
            <Button @click="onReset">重置</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>

    <Card>
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          showSizeChanger: true,
          total,
          onChange: onTableChange,
          onShowSizeChange: onTableChange,
        }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag
              v-if="(record as ProductListItem).status"
              :color="
                statusColorMap[
                  (record as ProductListItem)
                    .status as keyof typeof statusColorMap
                ]
              "
            >
              {{
                statusTextMap[
                  (record as ProductListItem)
                    .status as keyof typeof statusTextMap
                ] ?? (record as ProductListItem).status
              }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'skuCount'">
            {{ (record as ProductListItem).skuList?.length ?? 0 }}
          </template>
          <template v-else-if="column.key === 'priceRange'">
            {{ formatSkuPriceRange(record as ProductListItem) }}
          </template>
          <template v-else-if="column.key === 'stockTotal'">
            {{ calcTotalStock(record as ProductListItem) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button
                size="small"
                type="link"
                @click="openDetail((record as ProductListItem).id)"
              >
                详情
              </Button>
              <Button
                v-if="canUpdate()"
                size="small"
                type="link"
                @click="openEdit(record as ProductListItem)"
              >
                编辑
              </Button>
              <Button
                v-if="
                  canUpdateStatus() &&
                  (record as ProductListItem).status !== 'ON_SHELF'
                "
                size="small"
                type="link"
                @click="changeStatus(record as ProductListItem, 'ON_SHELF')"
              >
                上架
              </Button>
              <Button
                v-if="
                  canUpdateStatus() &&
                  (record as ProductListItem).status !== 'OFF_SHELF'
                "
                size="small"
                type="link"
                @click="changeStatus(record as ProductListItem, 'OFF_SHELF')"
              >
                下架
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="createOpen"
      :confirm-loading="createLoading"
      title="新增商品"
      width="680px"
      @ok="submitCreate"
    >
      <Form layout="vertical">
        <Form.Item label="商品编码" required>
          <Input v-model:value="createForm.productCode" />
        </Form.Item>
        <Form.Item label="商品名称" required>
          <Input v-model:value="createForm.productName" />
        </Form.Item>
        <Form.Item label="分类" required>
          <Select
            v-model:value="createForm.categoryId"
            :options="categoryOptions"
            placeholder="请选择分类"
          />
        </Form.Item>
        <Form.Item label="单位">
          <Input v-model:value="createForm.unit" />
        </Form.Item>
        <Form.Item label="描述">
          <Input.TextArea v-model:value="createForm.description" :rows="2" />
        </Form.Item>
        <Form.Item label="主图">
          <BizImageUpload
            v-model="createForm.mainImage"
            button-text="上传商品主图"
            type="product"
          />
        </Form.Item>
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">SKU 列表</span>
          <Button size="small" type="dashed" @click="addCreateSku">
            新增SKU
          </Button>
        </div>
        <Table
          :columns="skuColumns"
          :data-source="createForm.skuList"
          :pagination="false"
          row-key="tempKey"
          size="small"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'skuCode'">
              <Input v-model:value="(record as ProductSkuFormItem).skuCode" />
            </template>
            <template v-else-if="column.key === 'price'">
              <InputNumber
                v-model:value="(record as ProductSkuFormItem).price"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </template>
            <template v-else-if="column.key === 'stock'">
              <InputNumber
                v-model:value="(record as ProductSkuFormItem).stock"
                :min="0"
                style="width: 100%"
              />
            </template>
            <template v-else-if="column.key === 'skuImage'">
              <BizImageUpload
                :model-value="(record as ProductSkuFormItem).skuImage"
                button-text="上传SKU图"
                type="product"
                @update:model-value="
                  (value) => ((record as ProductSkuFormItem).skuImage = value)
                "
              />
            </template>
            <template v-else-if="column.key === 'specification'">
              {{ renderSkuSpecPreview(record as ProductSkuFormItem) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space>
                <Button
                  :disabled="index === 0"
                  size="small"
                  type="link"
                  @click="copySpecFromPrevious('create', index)"
                >
                  复制上行
                </Button>
                <Button
                  size="small"
                  type="link"
                  @click="
                    openSpecEditor('create', record as ProductSkuFormItem)
                  "
                >
                  规格
                </Button>
                <Button
                  danger
                  size="small"
                  type="link"
                  @click="
                    removeCreateSku((record as ProductSkuFormItem).tempKey)
                  "
                >
                  删除
                </Button>
              </Space>
            </template>
          </template>
        </Table>
      </Form>
    </Modal>

    <Modal
      v-model:open="editOpen"
      :confirm-loading="editLoading"
      title="编辑商品"
      width="920px"
      @ok="submitEdit"
    >
      <Tabs v-model:active-key="editActiveTab">
        <Tabs.TabPane key="basic" tab="基础信息">
          <Form layout="vertical">
            <Form.Item label="商品编码" required>
              <Input v-model:value="editForm.productCode" />
            </Form.Item>
            <Form.Item label="商品名称" required>
              <Input v-model:value="editForm.productName" />
            </Form.Item>
            <Form.Item label="分类" required>
              <Select
                v-model:value="editForm.categoryId"
                :options="categoryOptions"
                placeholder="请选择分类"
              />
            </Form.Item>
            <Form.Item label="单位">
              <Input v-model:value="editForm.unit" />
            </Form.Item>
            <Form.Item label="描述">
              <Input.TextArea v-model:value="editForm.description" :rows="2" />
            </Form.Item>
            <Form.Item label="主图">
              <BizImageUpload
                v-model="editForm.mainImage"
                button-text="上传商品主图"
                type="product"
                @success="handleEditMainImageUpload"
              />
            </Form.Item>
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-medium">SKU 列表</span>
              <Button size="small" type="dashed" @click="addEditSku">
                新增SKU
              </Button>
            </div>
            <Table
              :columns="skuColumns"
              :data-source="editForm.skuList"
              :pagination="false"
              row-key="tempKey"
              size="small"
            >
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'skuCode'">
                  <Input
                    v-model:value="(record as ProductSkuFormItem).skuCode"
                  />
                </template>
                <template v-else-if="column.key === 'price'">
                  <InputNumber
                    v-model:value="(record as ProductSkuFormItem).price"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                  />
                </template>
                <template v-else-if="column.key === 'stock'">
                  <InputNumber
                    v-model:value="(record as ProductSkuFormItem).stock"
                    :min="0"
                    style="width: 100%"
                  />
                </template>
                <template v-else-if="column.key === 'skuImage'">
                  <div class="flex flex-col gap-2">
                    <BizImageUpload
                      :model-value="(record as ProductSkuFormItem).skuImage"
                      button-text="上传SKU图"
                      type="product"
                      @update:model-value="
                        (value) =>
                          ((record as ProductSkuFormItem).skuImage = value)
                      "
                    />
                    <Space wrap>
                      <Button
                        size="small"
                        type="link"
                        @click="
                          openSkuImagePicker(
                            'edit',
                            record as ProductSkuFormItem,
                          )
                        "
                      >
                        从相册选
                      </Button>
                      <Button
                        v-if="(record as ProductSkuFormItem).skuImage"
                        danger
                        size="small"
                        type="link"
                        @click="
                          clearSkuImage(
                            'edit',
                            (record as ProductSkuFormItem).tempKey,
                          )
                        "
                      >
                        清空
                      </Button>
                    </Space>
                  </div>
                </template>
                <template v-else-if="column.key === 'specification'">
                  {{ renderSkuSpecPreview(record as ProductSkuFormItem) }}
                </template>
                <template v-else-if="column.key === 'actions'">
                  <Space>
                    <Button
                      :disabled="index === 0"
                      size="small"
                      type="link"
                      @click="copySpecFromPrevious('edit', index)"
                    >
                      复制上行
                    </Button>
                    <Button
                      size="small"
                      type="link"
                      @click="
                        openSpecEditor('edit', record as ProductSkuFormItem)
                      "
                    >
                      规格
                    </Button>
                    <Button
                      danger
                      size="small"
                      type="link"
                      @click="
                        removeEditSku((record as ProductSkuFormItem).tempKey)
                      "
                    >
                      删除
                    </Button>
                  </Space>
                </template>
              </template>
            </Table>
          </Form>
        </Tabs.TabPane>
        <Tabs.TabPane key="gallery" tab="相册管理">
          <div class="mb-4 rounded border border-dashed border-gray-300 p-4">
            <div class="mb-3 text-sm text-gray-500">
              相册用于维护多张商品图，可单独设置主图、排序和删除。
            </div>
            <BizImageUpload
              v-if="canAddImage()"
              v-model="galleryUploadValue"
              :disabled="imageActionLoading"
              button-text="上传相册图片"
              type="product"
              @success="handleGalleryUpload"
            />
          </div>

          <div
            v-if="editImages.length === 0"
            class="py-8 text-center text-sm text-gray-500"
          >
            当前暂无相册图片，可先上传主图或新增相册图片。
          </div>

          <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card v-for="image in editImages" :key="image.imageId" size="small">
              <div class="mb-3 flex items-center justify-between">
                <Tag :color="image.isMain ? 'success' : 'default'">
                  {{ image.isMain ? '主图' : '普通图' }}
                </Tag>
                <div class="text-xs text-gray-500">ID: {{ image.imageId }}</div>
              </div>
              <div
                class="mb-3 flex h-48 items-center justify-center overflow-hidden rounded bg-gray-50"
              >
                <img
                  :src="image.imageUrl"
                  alt="product"
                  class="h-full w-full object-contain"
                />
              </div>
              <Form layout="vertical">
                <Form.Item label="排序值">
                  <div class="flex gap-2">
                    <InputNumber
                      v-model:value="image.sort"
                      :min="0"
                      style="width: 140px"
                    />
                    <Button
                      v-if="canSortImage()"
                      :loading="imageActionLoading"
                      type="default"
                      @click="saveImageSort(image)"
                    >
                      保存排序
                    </Button>
                  </div>
                </Form.Item>
              </Form>
              <Space wrap>
                <Button
                  v-if="canSetMainImage() && !image.isMain"
                  :loading="imageActionLoading"
                  size="small"
                  type="link"
                  @click="setGalleryMainImage(image)"
                >
                  设为主图
                </Button>
                <Popconfirm
                  v-if="canRemoveImage()"
                  title="确认删除这张图片？"
                  @confirm="removeGalleryImage(image)"
                >
                  <Button danger size="small" type="link">删除</Button>
                </Popconfirm>
              </Space>
            </Card>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </Modal>

    <Modal
      v-model:open="specOpen"
      :footer="null"
      title="编辑SKU规格"
      width="720px"
    >
      <div class="mb-3">
        <Button size="small" type="dashed" @click="addSpecItem">
          新增规格项
        </Button>
      </div>
      <Table
        :columns="[
          { dataIndex: 'key', key: 'key', title: '规格名(如 颜色)' },
          { dataIndex: 'value', key: 'value', title: '规格值(如 黑色)' },
          { key: 'actions', title: '操作', width: 80 },
        ]"
        :data-source="findTargetSku()?.specificationItems || []"
        :pagination="false"
        row-key="tempKey"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'key'">
            <Input v-model:value="record.key" placeholder="例如：颜色" />
          </template>
          <template v-else-if="column.key === 'value'">
            <Input v-model:value="record.value" placeholder="例如：黑色" />
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button
              danger
              size="small"
              type="link"
              @click="removeSpecItem(record.tempKey)"
            >
              删除
            </Button>
          </template>
        </template>
      </Table>
    </Modal>

    <Modal
      v-model:open="skuImagePickerOpen"
      :footer="null"
      title="选择商品相册图片"
      width="820px"
    >
      <div
        v-if="editImages.length === 0"
        class="py-8 text-center text-sm text-gray-500"
      >
        当前暂无商品相册图片。
      </div>
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card v-for="image in editImages" :key="image.imageId" size="small">
          <div
            class="mb-3 flex h-44 items-center justify-center overflow-hidden rounded bg-gray-50"
          >
            <img
              :src="image.imageUrl"
              alt="gallery"
              class="h-full w-full object-contain"
            />
          </div>
          <div
            class="mb-2 flex items-center justify-between text-xs text-gray-500"
          >
            <span>ID: {{ image.imageId }}</span>
            <Tag :color="image.isMain ? 'success' : 'default'">
              {{ image.isMain ? '主图' : '普通图' }}
            </Tag>
          </div>
          <Button
            block
            type="primary"
            @click="selectSkuImageFromGallery(image.imageUrl || '')"
          >
            选择这张图片
          </Button>
        </Card>
      </div>
    </Modal>

    <Modal
      v-model:open="detailOpen"
      :footer="null"
      :title="`商品详情 ${detailData?.productName ?? ''}`"
      width="900px"
    >
      <div v-if="detailLoading">加载中...</div>
      <div v-else-if="detailData">
        <div v-if="detailData.mainImage" class="mb-4 flex justify-center">
          <img
            :src="detailData.mainImage"
            :alt="detailData.productName || '商品主图'"
            class="max-h-56 rounded border border-gray-200 object-contain"
          />
        </div>
        <Descriptions :column="2" bordered class="mb-4" size="small">
          <Descriptions.Item label="商品ID">
            {{ detailData.productId }}
          </Descriptions.Item>
          <Descriptions.Item label="商品编码">
            {{ detailData.productCode }}
          </Descriptions.Item>
          <Descriptions.Item label="商品名称">
            {{ detailData.productName }}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag
              v-if="detailData.status"
              :color="statusColorMap[detailData.status]"
            >
              {{ statusTextMap[detailData.status] ?? detailData.status }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="单位">
            {{ detailData.unit || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="分类">
            {{ detailData.category?.categoryName || '-' }}
          </Descriptions.Item>
          <Descriptions.Item :span="2" label="描述">
            {{ detailData.description || '-' }}
          </Descriptions.Item>
        </Descriptions>

        <Table
          :columns="detailSkuColumns"
          :data-source="detailData.skuList || []"
          :pagination="false"
          row-key="skuId"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'skuImage'">
              <div
                v-if="record.skuImage || detailData.mainImage"
                class="flex justify-center"
              >
                <img
                  :src="record.skuImage || detailData.mainImage"
                  :alt="record.skuCode || 'sku-image'"
                  class="h-16 w-16 rounded border border-gray-200 object-cover"
                />
              </div>
              <span v-else class="text-xs text-gray-400">暂无图片</span>
            </template>
            <template v-else-if="column.key === 'specification'">
              {{ formatSpecificationView(record.specification) }}
            </template>
          </template>
        </Table>

        <div v-if="detailData.images?.length" class="mt-4">
          <div class="mb-3 text-sm font-medium">商品相册</div>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div
              v-for="image in detailData.images"
              :key="image.imageId"
              class="rounded border border-gray-200 p-2"
            >
              <div
                class="mb-2 flex h-28 items-center justify-center overflow-hidden rounded bg-gray-50"
              >
                <img
                  :src="image.imageUrl"
                  alt="detail-gallery"
                  class="h-full w-full object-cover"
                />
              </div>
              <div
                class="flex items-center justify-between text-xs text-gray-500"
              >
                <span>排序: {{ image.sort ?? 0 }}</span>
                <Tag :color="image.isMain ? 'success' : 'default'">
                  {{ image.isMain ? '主图' : '普通图' }}
                </Tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </Page>
</template>
