<template>
  <div class="payment-container">
    <div class="payment-header">
      <h1>请确认订单信息</h1>
      <p class="subtitle">请确认订单信息并完成支付</p>
    </div>

    <div class="payment-content">
      <!-- 商品信息 -->
      <div class="product-section">
        <h2>商品信息</h2>
        <div class="product-card">
          <div class="product-image">
            <div class="placeholder-image">📚</div>
          </div>
          <div class="product-details">
            <h3>博主前端学习笔记及亲笔签名</h3>
            <p class="product-description">
              包含完整的前端学习路径、实战项目经验分享，以及博主亲笔签名的限量版学习笔记
            </p>
            <div class="product-specs">
              <span class="spec">数字版 + 实体签名本</span>
              <span class="spec">包邮</span>
            </div>
            <div class="price">
              <span class="current-price">¥299.00</span>
              <span class="original-price">¥399.00</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 买家信息 -->
      <div class="buyer-section">
        <h2>买家信息</h2>
        <div class="buyer-card">
          <div class="buyer-avatar">
            <div class="avatar-placeholder">👤</div>
          </div>
          <div class="buyer-details">
            <div class="buyer-name">{{ currentUser.name }}</div>
            <div class="buyer-info">
              <p><strong>手机号:</strong> {{ currentUser.phone }}</p>
              <p><strong>邮箱:</strong> {{ currentUser.email }}</p>
              <p><strong>收货地址:</strong> {{ currentUser.address }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 订单摘要 -->
      <div class="order-summary">
        <h2>订单摘要</h2>
        <div class="summary-card">
          <div class="summary-row">
            <span>商品金额</span>
            <span>¥299.00</span>
          </div>
          <div class="summary-row">
            <span>运费</span>
            <span>免费</span>
          </div>
          <div class="summary-row">
            <span>优惠券</span>
            <span class="discount">-¥20.00</span>
          </div>
          <div class="summary-row total">
            <span>实付金额</span>
            <span class="total-amount">¥279.00</span>
          </div>
        </div>
      </div>

      <!-- 支付方式 -->
      <div class="payment-method">
        <h2>支付方式</h2>
        <div class="payment-options">
          <div class="payment-option active">
            <div class="option-icon">💳</div>
            <span>支付宝</span>
            <div class="check-mark">✓</div>
          </div>
          <div class="payment-option">
            <div class="option-icon">💰</div>
            <span>微信支付</span>
          </div>
        </div>
      </div>

      <!-- 支付按钮 -->
      <div class="payment-actions">
        <button class="pay-button" @click="handlePayment">
          立即支付 ¥279.00
        </button>
        <p class="payment-notice">
          点击支付即表示您同意 <a href="#">《服务协议》</a> 和 <a href="#">《隐私政策》</a>
        </p>
      </div>
    </div>

    <!-- 支付状态弹窗 -->
    <div v-if="showPaymentModal" class="payment-modal">
      <div class="modal-content">
        <div class="payment-status">
          <div class="status-icon">{{ paymentStatus === 'success' ? '✅' : '⏳' }}</div>
          <h3>{{ paymentStatusText }}</h3>
          <p v-if="paymentStatus === 'processing'">请在支付宝中完成支付...</p>
          <p v-if="paymentStatus === 'success'">感谢您的购买！</p>
        </div>
        <button v-if="paymentStatus === 'success'" @click="closeModal" class="close-button">
          确定
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Payment',
  data() {
    return {
      currentUser: {
        name: '蓝海俊',
        phone: '138****8888',
        email: 'haijun@qq.com',
        address: '广东省珠海市香洲区华南名宇18栋2单元1603'
      },
      showPaymentModal: false,
      paymentStatus: 'processing', // processing, success, failed
      paymentStatusText: '支付处理中...'
    }
  },
  methods: {
    handlePayment() {
      this.showPaymentModal = true
      this.paymentStatus = 'processing'
      this.paymentStatusText = '支付处理中...'
      
      // 模拟支付过程
      setTimeout(() => {
        this.paymentStatus = 'success'
        this.paymentStatusText = '支付成功！'
      }, 2000)
    },
    closeModal() {
      this.showPaymentModal = false
      // 可以跳转到订单详情页面
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.payment-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.payment-header {
  text-align: center;
  margin-bottom: 30px;
}

.payment-header h1 {
  color: #1677ff;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.payment-content > div {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.payment-content h2 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #333;
  font-size: 18px;
}

/* 商品信息样式 */
.product-card {
  display: flex;
  gap: 16px;
}

.product-image {
  flex-shrink: 0;
}

.placeholder-image {
  width: 80px;
  height: 80px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.product-details h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.product-description {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
  line-height: 1.5;
}

.product-specs {
  margin-bottom: 12px;
}

.spec {
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 8px;
}

.price {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-price {
  font-size: 20px;
  font-weight: bold;
  color: #ff4d4f;
}

.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

/* 买家信息样式 */
.buyer-card {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.buyer-avatar {
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 60px;
  height: 60px;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.buyer-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}

.buyer-info p {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}

/* 订单摘要样式 */
.summary-card {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row.total {
  background: #f8f9fa;
  font-weight: bold;
}

.discount {
  color: #52c41a;
}

.total-amount {
  color: #ff4d4f;
  font-size: 18px;
}

/* 支付方式样式 */
.payment-options {
  display: flex;
  gap: 12px;
}

.payment-option {
  flex: 1;
  padding: 16px;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.payment-option:hover {
  border-color: #1677ff;
}

.payment-option.active {
  border-color: #1677ff;
  background: #f6ffed;
}

.option-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.check-mark {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #52c41a;
  font-weight: bold;
}

/* 支付按钮样式 */
.payment-actions {
  text-align: center;
}

.pay-button {
  width: 100%;
  padding: 16px;
  background: #1677ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

.pay-button:hover {
  background: #0958d9;
}

.payment-notice {
  margin-top: 12px;
  font-size: 12px;
  color: #999;
}

.payment-notice a {
  color: #1677ff;
  text-decoration: none;
}

/* 支付弹窗样式 */
.payment-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  min-width: 300px;
}

.status-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.payment-status h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.payment-status p {
  color: #666;
  margin-bottom: 20px;
}

.close-button {
  padding: 12px 24px;
  background: #1677ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.close-button:hover {
  background: #0958d9;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .payment-container {
    padding: 16px;
  }
  
  .product-card {
    flex-direction: column;
  }
  
  .payment-options {
    flex-direction: column;
  }
  
  .buyer-card {
    flex-direction: column;
    text-align: center;
  }
}
</style>