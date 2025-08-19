<template>
  <div class="home-content">
    <div class="welcome-section">
      <h1>欢迎来到 Lafin 的博客</h1>
      <p>这里是我分享技术笔记和学习心得的地方</p>
    </div>
    
    <div class="features-grid">
      <div class="feature-card" @click="goToNotes">
        <div class="feature-icon">📝</div>
        <h3>技术笔记</h3>
        <p>记录学习过程中的重要知识点和心得体会</p>
      </div>
      
      <div class="feature-card" @click="goToLearning">
        <div class="feature-icon">🚀</div>
        <h3>应用实践</h3>
        <p>各种技术栈的实际应用和项目实践</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToNotes = () => {
  router.push('/notes')
}

const goToLearning = () => {
  router.push('/learning')
}
</script>

<style scoped lang="scss">
.home-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.welcome-section {
  text-align: center;
  margin-bottom: 60px;
  
  h1 {
    font-size: 2.5rem;
    color: #333;
    margin-bottom: 16px;
    font-weight: 600;
  }
  
  p {
    font-size: 1.2rem;
    color: #666;
    margin: 0;
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 60px;
}

.feature-card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
  
  .feature-icon {
    font-size: 3rem;
    margin-bottom: 20px;
  }
  
  h3 {
    font-size: 1.5rem;
    color: #333;
    margin-bottom: 12px;
    font-weight: 600;
  }
  
  p {
    color: #666;
    line-height: 1.6;
    margin: 0;
  }
}

.posts-list {
  .post-item {
    display: flex;
    align-items: center;
    padding: 15px 0;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: background-color 0.2s ease;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background-color: #f8f9fa;
      padding-left: 10px;
      padding-right: 10px;
      margin-left: -10px;
      margin-right: -10px;
      border-radius: 6px;
    }
    
    .post-date {
      color: #999;
      font-size: 0.9rem;
      min-width: 100px;
    }
    
    .post-title {
      color: #333;
      font-weight: 500;
      margin-left: 20px;
    }
  }
}

@media (max-width: 768px) {
  .home-content {
    padding: 20px 15px;
  }
  
  .welcome-section {
    h1 {
      font-size: 2rem;
    }
    
    p {
      font-size: 1rem;
    }
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .feature-card {
    padding: 20px;
  }
}
</style>
