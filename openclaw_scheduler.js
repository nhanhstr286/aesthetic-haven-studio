/**
 * OpenClaw Pinterest Cron Scheduler
 * Schedules pin postings:
 * - Next pins every 24 hours at 21:00 EST (02:00 UTC)
 */

const { publishPin, loadQueue, saveQueue } = require('./pinterest_publisher');

function getMillisecondsUntilNext2100EST() {
  const now = new Date();
  
  // 21:00 EST is 02:00 UTC next day
  const nextRun = new Date();
  nextRun.setUTCHours(2, 0, 0, 0); // 02:00:00.000 UTC

  if (now.getTime() >= nextRun.getTime()) {
    // If today's 02:00 UTC already passed, schedule for tomorrow 02:00 UTC
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  }

  const diffMs = nextRun.getTime() - now.getTime();
  return { diffMs, nextRun };
}

async function runScheduler() {
  console.log('======================================================');
  console.log('       OPENCLAW PINTEREST 24/7 CRON SCHEDULER         ');
  console.log('======================================================');

  try {
    const queue = loadQueue();
    const readyCount = queue.filter(p => p.status === 'ready').length;
    const publishedCount = queue.filter(p => p.status === 'published').length;
    console.log(`📋 Hàng đợi hiện tại: Tổng cộng ${queue.length} items (${publishedCount} đã xuất bản, ${readyCount} sẵn sàng)`);
  } catch (e) {
    console.warn('⚠️ Không thể đọc trước hàng đợi:', e.message);
  }

  function scheduleNext() {
    const { diffMs, nextRun } = getMillisecondsUntilNext2100EST();
    const hours = (diffMs / (1000 * 60 * 60)).toFixed(2);
    
    console.log(`\n⏰ Lịch đăng tiếp theo: ${nextRun.toUTCString()} (tức 21:00 EST)`);
    console.log(`⏳ Thời gian chờ: ${hours} giờ (${Math.round(diffMs / 1000)} giây)...`);

    setTimeout(async () => {
      console.log('\n🚀 Đến khung giờ vàng (21:00 EST)! Bắt đầu đăng bài...');
      try {
        const queue = loadQueue();
        const nextPin = queue.find(p => p.status === 'ready');
        if (nextPin) {
          await publishPin(nextPin);
          saveQueue(queue);
          console.log(`✅ Đã đăng thành công [${nextPin.id}]!`);
        } else {
          console.log('📋 Toàn bộ Pin trong hàng đợi đã được đăng hoàn tất.');
        }
      } catch (err) {
        console.error('❌ Lỗi khi tự động đăng theo lịch:', err.message);
      }
      
      // Schedule next day
      scheduleNext();
    }, diffMs);
  }

  scheduleNext();
}

if (require.main === module) {
  runScheduler();
}

module.exports = { runScheduler, getMillisecondsUntilNext2100EST };
