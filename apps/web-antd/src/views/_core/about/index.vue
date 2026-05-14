<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { Card, Descriptions, Tag } from 'ant-design-vue';

defineOptions({ name: 'SystemAbout' });
</script>

<template>
  <Page title="关于系统">
    <Card>
      <Descriptions :column="2" bordered size="small" title="BizPort">
        <Descriptions.Item label="系统名称">
          BizPort 管理后台
        </Descriptions.Item>
        <Descriptions.Item label="系统定位">
          单商家批发订货管理系统
        </Descriptions.Item>
        <Descriptions.Item label="适用场景">
          县域服装、鞋类等批发商的商品、库存、客户、订单与支付管理
        </Descriptions.Item>
        <Descriptions.Item label="当前阶段">
          <Tag color="processing">MVP</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="前端技术">
          Vue 3 / Vite / TypeScript / Ant Design Vue
        </Descriptions.Item>
        <Descriptions.Item label="后端技术">
          Spring Boot / MyBatis-Plus / Sa-Token
        </Descriptions.Item>
      </Descriptions>
    </Card>
  </Page>
</template>
