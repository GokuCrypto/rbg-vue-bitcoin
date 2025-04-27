

<script lang="ts">
import { defineComponent } from 'vue';
import { createAppKit, AppKitButton } from '@reown/appkit/vue';
import { bitcoinAdapter, networks, projectId } from './config/index';
import ActionButtonList from './components/ActionButton.vue';
import InfoList from './components/InfoList.vue';
import { address as btcAddress, networks as btcNetworks } from 'bitcoinjs-lib';

// 初始化 AppKit
createAppKit({
  adapters: [bitcoinAdapter],
  networks,
  projectId,
  themeMode: 'light',
  features: {
    analytics: true,
    socials: [],
    email: false,
  },
  metadata: {
    name: 'AppKit Vue Example',
    description: 'AppKit Vue Example',
    url: 'https://reown.com/appkit',
    icons: ['https://avatars.githubusercontent.com/u/179229932?s=200&v=4'],
  },
  themeVariables: {
    '--w3m-accent': '#409eff', // 与 Element Plus 主色调一致
    '--w3m-background': '#ffffff',
    '--w3m-border-radius': '4px',
    '--w3m-font-family': 'Roboto, sans-serif',
  },
});

export default defineComponent({
  name: 'App',
  components: {
    AppkitButton,
    ActionButtonList,
    InfoList,
  },
  data() {
    return {
      form: {
        amount: null as number | null,
        feeRate: null as number | null,
        receiverAddress: '',
      },
      isLoading: false,
      transactionStatus: null as { success: boolean; message: string } | null,
    };
  },
  computed: {
    isFormValid(): boolean {
      return (
        this.form.amount !== null &&
        this.form.amount > 0 &&
        this.form.feeRate !== null &&
        this.form.feeRate > 0 &&
        this.isValidBtcAddress(this.form.receiverAddress)
      );
    },
  },
  methods: {
    isValidBtcAddress(addr: string): boolean {
      try {
        btcAddress.toOutputScript(addr, btcNetworks.bitcoin);
        return true;
      } catch (e) {
        return false;
      }
    },
    async handleTransfer() {
      this.isLoading = true;
      this.transactionStatus = null;
      try {
        if (!this.isValidBtcAddress(this.form.receiverAddress)) {
          throw new Error('无效的 Bitcoin 地址');
        }
        const transferData = {
          amount: this.form.amount!,
          feeRate: this.form.feeRate!,
          toAddress: this.form.receiverAddress,
        };
        const txId = await this.sendBtcTransfer(transferData);
        this.transactionStatus = {
          success: true,
          message: `转账成功！交易 ID: ${txId}`,
        };
      } catch (error: any) {
        this.transactionStatus = {
          success: false,
          message: `转账失败: ${error.message || '未知错误'}`,
        };
      } finally {
        this.isLoading = false;
      }
    },
    async sendBtcTransfer(data: { amount: number; feeRate: number; toAddress: string }) {
      try {
        const amountSatoshi = Math.floor(data.amount * 1e8);
        const unisat = (window as any).unisat;
        const okxWallet = (window as any).okxwallet;
        if (!unisat && !okxWallet) {
          throw new Error('未检测到 UniSat 或 OKX 钱包');
        }
        let txId: string;
        if (unisat) {
          try {
            txId = await unisat.sendBitcoin(data.toAddress, amountSatoshi, { feeRate: data.feeRate });
          } catch (error: any) {
            throw new Error(`UniSat 发送交易失败: ${error.message || '未知错误'}`);
          }
        } else if (okxWallet) {
          try {
            txId = await okxWallet.bitcoin.sendBitcoin(data.toAddress, amountSatoshi, { feeRate: data.feeRate });
          } catch (error: any) {
            throw new Error(`OKX 发送交易失败: ${error.message || '未知错误'}`);
          }
        }
        if (!txId || typeof txId !== 'string') {
          console.log('sendBitcoin 返回:', txId);
          throw new Error('未返回有效的交易 ID');
        }
        return txId;
      } catch (error: any) {
        throw new Error(`发送交易失败: ${error.message || '未知错误'}`);
      }
    },
  },
});
</script>



<template>
  <div class="pages">
    <!-- 测试 Element Plus -->
    <el-card class="test-card">
      <h2>Element Plus 测试</h2>
      <el-button type="primary">测试按钮</el-button>
    </el-card>

    <el-container>
      <el-main>
        <!-- Logo and Title -->
        <div class="text-center mb-6">
          <img src="/logo.png" alt="Reown" width="120" height="120" class="mx-auto" />
          <h1 class="text-3xl font-bold">BTC 转账</h1>
        </div>

        <!-- Reown AppKit Button -->
        <div class="mb-6">
          <appkit-button />
        </div>

        <!-- Transfer Form -->
        <el-form :model="form" class="form" label-position="top">
          <el-form-item label="转账金额 (BTC)">
            <el-input
              v-model.number="form.amount"
              type="number"
              step="0.00000001"
              :min="0.00000001"
              placeholder="例如: 0.001"
            />
          </el-form-item>

          <el-form-item label="手续费 (sat/vB)">
            <el-input
              v-model.number="form.feeRate"
              type="number"
              :min="1"
              placeholder="例如: 10"
            />
          </el-form-item>

          <el-form-item label="接收地址">
            <el-input
              v-model="form.receiverAddress"
              placeholder="请输入 Bitcoin 地址"
            />
          </el-form-item>

          <!-- Transfer Button -->
          <el-button
            type="primary"
            :disabled="isLoading || !isFormValid"
            :loading="isLoading"
            @click="handleTransfer"
            class="w-full"
          >
            {{ isLoading ? '处理中...' : '立即转账' }}
          </el-button>

          <!-- Transaction Status -->
          <el-alert
            v-if="transactionStatus"
            :type="transactionStatus.success ? 'success' : 'error'"
            :title="transactionStatus.message"
            class="mt-4"
            show-icon
          />
        </el-form>

        <!-- Action and Info Components -->
        <div class="mt-6">
          <ActionButtonList />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
.pages {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.test-card {
  margin-bottom: 20px;
  text-align: center;
}

.form {
  max-width: 500px;
  margin: 0 auto;
}

.text-center {
  text-align: center;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.mt-6 {
  margin-top: 1.5rem;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
</style>