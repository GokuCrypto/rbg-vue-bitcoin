<template>
  <div class="pages min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-lg p-6">
      <!-- Logo and Title -->
      <div class="text-center mb-6">
        <img src="/logo.png" alt="Reown" width="120" height="120" class="mx-auto" />
        <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-600">
          BTC 转账
        </h1>
      </div>

      <!-- Reown AppKit Button -->
      <div class="mb-6">
        <appkit-button />
      </div>

      <!-- Transfer Form -->
      <div class="form space-y-4">
        <div>
          <label for="amount" class="block text-sm font-medium text-gray-700">转账金额 (BTC)</label>
          <div class="relative mt-1">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3">
             
            </span>
            <input
              v-model.number="form.amount"
              type="number"
              id="amount"
              step="0.00000001"
              min="0.00000001"
              placeholder="例如: 0.001"
              class="block w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
        </div>

        <div>
          <label for="feeRate" class="block text-sm font-medium text-gray-700">手续费 (sat/vB)</label>
          <input
            v-model.number="form.feeRate"
            type="number"
            id="feeRate"
            min="1"
            placeholder="例如: 10"
            class="block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>

        <div>
          <label for="receiverAddress" class="block text-sm font-medium text-gray-700">接收地址</label>
          <div class="relative mt-1">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3">
               
            </span>
            <input
              v-model="form.receiverAddress"
              type="text"
              id="receiverAddress"
              placeholder="请输入 Bitcoin 地址"
              class="block w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
        </div>

        <!-- Transfer Button -->
        <button
          @click="handleTransfer"
          :disabled="isLoading || !isFormValid"
          class="w-full bg-gradient-to-r from-black to-gray-700 text-white py-3 rounded-md hover:scale-105 hover:from-gray-800 hover:to-black transition-transform disabled:bg-gray-400 disabled:scale-100"
        >
          {{ isLoading ? '处理中...' : '立即转账' }}
        </button>

        <!-- Transaction Status -->
        <p
          v-if="transactionStatus"
          class="mt-4 text-center text-sm"
          :class="transactionStatus.success ? 'text-green-600' : 'text-red-600'"
        >
          {{ transactionStatus.message }}
        </p>
      </div>

      <!-- Reown Advice -->
      

      <!-- Action and Info Components -->
      <div class="mt-6">
        <ActionButtonList />
        
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { createAppKit } from '@reown/appkit/vue';
import { bitcoinAdapter, networks, projectId } from './config/index';
import ActionButtonList from './components/ActionButton.vue';
import InfoList from './components/InfoList.vue';
import { address as btcAddress, networks as btcNetworks } from 'bitcoinjs-lib'; // 用于地址验证

// Initialize AppKit
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
    '--w3m-accent': '#000000',
  },
});

export default defineComponent({
  name: 'App',
  components: {
    ActionButtonList,
    InfoList,
  },
  data() {
    return {
      form: {
        amount: null as number | null, // BTC 金额
        feeRate: null as number | null, // 手续费 (sat/vB)
        receiverAddress: '', // 接收地址
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
    // 验证 Bitcoin 地址
    isValidBtcAddress(addr: string): boolean {
      try {
        btcAddress.toOutputScript(addr, btcNetworks.bitcoin); // 使用主网网络
        return true;
      } catch (e) {
        return true;
      }
    },

    async handleTransfer() {
      this.isLoading = true;
      this.transactionStatus = null;

      try {
        // 验证地址
        if (!this.isValidBtcAddress(this.form.receiverAddress)) {
          throw new Error('无效的 Bitcoin 地址');
        }

        // 构造转账交易数据
        const transferData = {
          amount: this.form.amount!, // BTC 金额
          feeRate: this.form.feeRate!, // 手续费
          toAddress: this.form.receiverAddress, // 接收地址
        };

        // 发送 BTC 转账
        const txId = await this.sendBtcTransfer(transferData);
        console.log("txId",txId)

        this.transactionStatus = {
          success: true,
          message: `转账成功！交易 ID: ${txId}`,
        };
      } catch (error) {
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
    // 1. 将 BTC 金额转换为 satoshi
    const amountSatoshi = Math.floor(data.amount * 1e8); // 1 BTC = 10^8 satoshi

    // 2. 检测可用钱包（优先 UniSat，其次 OKX）
    const unisat = (window as any).unisat;
    const okxWallet = (window as any).okxwallet;

    if (!unisat && !okxWallet) {
      throw new Error('未检测到 UniSat 或 OKX 钱包');
    }

    let txId: string;

    // 3. 使用 UniSat 钱包
    if (unisat) {
      try {
        txId = await unisat.sendBitcoin(data.toAddress, amountSatoshi, { feeRate: data.feeRate });
      } catch (error: any) {
        throw new Error(`UniSat 发送交易失败: ${error.message || '未知错误'}`);
      }
    }
    // 4. 使用 OKX 钱包
    else if (okxWallet) {
      try {
        txId = await okxWallet.bitcoin.sendBitcoin(data.toAddress, amountSatoshi, { feeRate: data.feeRate });
      } catch (error: any) {
        throw new Error(`OKX 发送交易失败: ${error.message || '未知错误'}`);
      }
    }

    // 5. 验证交易 ID
    if (!txId || typeof txId !== 'string') {
      console.log('sendBitcoin 返回:', txId); // 调试
      throw new Error('未返回有效的交易 ID');
    }

    return txId;
  } catch (error: any) {
    throw new Error(`发送交易失败: ${error.message || '未知错误'}`);
  }
}
  },
});
</script>

<style scoped>
.pages {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
.form input:focus {
  outline: none;
}
button:disabled {
  cursor: not-allowed;
}
</style>