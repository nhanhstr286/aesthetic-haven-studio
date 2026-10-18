/**
 * ==============================================================================
 * AESTHETIC HAVEN STUDIO – GOOGLE APPS SCRIPT AUTOMATION SUITE
 * ==============================================================================
 * Features:
 * 1. doPost(e): Webhook receiving new leads from /api/lead-capture.
 *    - Records 7 columns: Timestamp, Name, Email, Niche, Source, Status, Nurture_Status
 *    - Sends Instant Lead Magnet Welcome Email via Gmail (MailApp)
 * 2. sendDay2NurtureEmails(): 48h Drip Nurturing Engine
 *    - Scans leads with Nurture_Status = "Pending_Day2" >= 48 hours
 *    - Delivers tailored Warm Editorial tips & links back to https://agentwell.agency
 *    - Updates Nurture_Status to "Day2_Sent"
 * 3. setupDailyNurtureTrigger(): 1-Click setup for daily automated execution
 * 4. testSendNurtureNow(): Helper to test Day 2 email immediately for verification
 * ==============================================================================
 */

// 1. WEBHOOK RECEIVER (POST)
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    var timestamp = data.timestamp || new Date().toISOString();
    var name = data.name || 'Friend';
    var email = data.email || '';
    var niche = data.niche || 'Room Decor & Lighting';
    var source = data.source || 'pinterest';
    var status = data.status || 'Gift_Sent';
    var nurtureStatus = data.nurtureStatus || 'Pending_Day2';

    // Đảm bảo tiêu đề cột dòng 1 nếu là bảng mới
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'Niche', 'Source', 'Status', 'Nurture_Status']);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#FAF8F5');
    }

    // Ghi 7 trường dữ liệu vào Google Sheet
    sheet.appendRow([
      timestamp,
      name,
      email,
      niche,
      source,
      status,
      nurtureStatus
    ]);

    // Tự động gửi Email quà tặng tức thì (Instant Lead Magnet Delivery)
    if (email) {
      sendInstantLeadMagnetEmail(email, name, niche, data.giftTitle, data.giftLink);
    }

    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      timestamp: timestamp,
      nurtureStatus: nurtureStatus
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 2. EMAIL QUÀ TẶNG TỨC THÌ (INSTANT WELCOME EMAIL)
function sendInstantLeadMagnetEmail(email, name, niche, giftTitle, giftLink) {
  var title = giftTitle || 'Your Requested Aesthetic Guide';
  var link = giftLink || 'https://agentwell.agency';

  var subject = '✨ [Aesthetic Haven Studio] Your Free Gift: ' + title;
  var htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; padding: 40px 20px; color: #1F1F1F;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #EAE6DF; padding: 36px 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
        <div style="border-bottom: 1px solid #EAE6DF; padding-bottom: 18px; margin-bottom: 24px; text-align: center;">
          <span style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #C07053; font-weight: bold;">Aesthetic Haven Studio</span>
          <h1 style="font-family: Georgia, serif; font-size: 22px; color: #1F1F1F; margin: 8px 0 0 0; font-weight: normal;">Your sanctuary guide is ready.</h1>
        </div>

        <p style="font-size: 14px; line-height: 1.7; color: #4A4A4A;">Hi <strong>${name}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.7; color: #4A4A4A;">Thank you for stopping by our studio from Pinterest. We curate spaces, tools, and digital goods for mindful, intentional living.</p>

        <div style="background-color: #FAF8F5; border-radius: 12px; border: 1px solid #EAE6DF; padding: 22px; margin: 26px 0; text-align: center;">
          <span style="font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #5E6E59; font-weight: bold; background: #EFEFE9; padding: 4px 10px; rounded: 4px;">FREE DOWNLOAD</span>
          <h3 style="font-family: Georgia, serif; font-size: 17px; color: #1F1F1F; margin: 12px 0 6px 0;">${title}</h3>
          <p style="font-size: 12px; color: #736E65; margin: 0 0 18px 0;">High-resolution PDF & curated cheatsheet.</p>
          <a href="${link}" style="background-color: #1F1F1F; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 24px; border-radius: 10px; display: inline-block;">Access Free Guide &rarr;</a>
        </div>

        <p style="font-size: 13px; line-height: 1.6; color: #736E65;">Keep an eye on your inbox in the next couple of days — we'll share an exclusive design tip to help you elevate your daily routine.</p>

        <div style="border-top: 1px solid #EAE6DF; margin-top: 32px; padding-top: 20px; text-align: center; font-size: 11px; color: #A09B90;">
          <p style="margin: 0;">&copy; 2026 Aesthetic Haven Studio &bull; Curated Living &bull; <a href="https://agentwell.agency" style="color: #A09B90; text-decoration: underline;">agentwell.agency</a></p>
        </div>
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });
}

// 3. HÀM NUÔI DƯỠNG EMAIL 48H (DAY 2 NURTURE DRIP)
function sendDay2NurtureEmails() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return; // Chỉ có header hoặc bảng trống

  var now = new Date().getTime();
  var sentCount = 0;

  // Lặp qua từng dòng (bỏ qua dòng 1 tiêu đề)
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var timestampStr = row[0];
    var name = row[1] || 'Friend';
    var email = row[2];
    var niche = row[3] || 'Room Decor & Lighting';
    var nurtureStatus = row[6]; // Cột thứ 7 (index 6)

    // Điều kiện: Chưa gửi Day 2 và thời gian đăng ký đã trôi qua >= 48 giờ
    if (email && nurtureStatus === 'Pending_Day2') {
      var leadTime = new Date(timestampStr).getTime();
      var hoursElapsed = (now - leadTime) / (1000 * 60 * 60);

      if (hoursElapsed >= 48) {
        // Gửi email nurture cá nhân hóa theo niche
        sendPersonalizedDay2Email(email, name, niche);

        // Cập nhật trạng thái cột thứ 7 thành "Day2_Sent"
        sheet.getRange(i + 1, 7).setValue('Day2_Sent');
        sentCount++;
      }
    }
  }

  Logger.log('Hoàn thành quét email Day 2. Tổng số email đã gửi: ' + sentCount);
}

// 4. NỘI DUNG EMAIL DAY 2 THEO TỪNG NICHE (WARM EDITORIAL)
function sendPersonalizedDay2Email(email, name, niche) {
  var nicheConfig = getNurtureContent(niche);

  var htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; padding: 40px 20px; color: #1F1F1F;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #EAE6DF; padding: 36px 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
        <div style="border-bottom: 1px solid #EAE6DF; padding-bottom: 18px; margin-bottom: 24px;">
          <span style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #C07053; font-weight: bold;">Aesthetic Haven Studio &bull; The 48h Curation Edit</span>
          <h1 style="font-family: Georgia, serif; font-size: 23px; color: #1F1F1F; margin: 10px 0 0 0; line-height: 1.35; font-weight: normal;">${nicheConfig.headline}</h1>
        </div>

        <p style="font-size: 14px; line-height: 1.7; color: #4A4A4A;">Hi <strong>${name}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.7; color: #4A4A4A;">Two days ago, you claimed your free guide from our <strong>${niche}</strong> edit. We hope you've had a chance to look through it.</p>
        
        <p style="font-size: 14px; line-height: 1.7; color: #4A4A4A;">Today, we wanted to share our team's #1 golden rule that makes the biggest practical difference:</p>

        <!-- Editorial Insight Box -->
        <div style="background-color: #F8F6F1; border-left: 3px solid #C07053; border-radius: 0 12px 12px 0; padding: 18px 20px; margin: 24px 0;">
          <h4 style="font-family: Georgia, serif; font-size: 15px; margin: 0 0 8px 0; color: #1F1F1F;">💡 ${nicheConfig.tipTitle}</h4>
          <p style="font-size: 13px; line-height: 1.65; color: #4A4A4A; margin: 0;">${nicheConfig.tipBody}</p>
        </div>

        <p style="font-size: 14px; line-height: 1.7; color: #4A4A4A;">We recently updated our main showcase gallery with verified finds, styling blueprints, and exclusive digital tools:</p>

        <!-- CTA Showcase Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${nicheConfig.collectionLink}" style="background-color: #1F1F1F; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 600; padding: 14px 28px; border-radius: 12px; display: inline-block; letter-spacing: 0.3px;">
            Explore Full ${niche} Collection &rarr;
          </a>
        </div>

        <p style="font-size: 12px; line-height: 1.6; color: #8C867A; margin-bottom: 0;">
          With warmth,<br>
          <strong>Aesthetic Haven Studio</strong><br>
          <span style="font-size: 11px;">Curated Living, Warm Spaces & Digital Lifestyle</span>
        </p>

        <div style="border-top: 1px solid #EAE6DF; margin-top: 32px; padding-top: 20px; text-align: center; font-size: 11px; color: #A09B90;">
          <p style="margin: 0;">You received this email because you downloaded a curated guide on <a href="https://agentwell.agency" style="color: #A09B90; text-decoration: underline;">agentwell.agency</a>.</p>
        </div>
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: email,
    subject: nicheConfig.subject,
    htmlBody: htmlBody
  });
}

// 5. NỘI DUNG TỪNG NGÁCH
function getNurtureContent(niche) {
  if (niche === 'Smart Kitchen Finds') {
    return {
      headline: 'The "Zone 0" Kitchen Reset: Keep Counters 100% Clutter-Free',
      subject: '🍳 Day 2: The 5-Minute Kitchen Countertop Reset',
      tipTitle: 'The "Two-Use-Daily" Rule',
      tipBody: 'Only appliances used at least twice every single day (like your electric kettle or gravity pepper grinder) deserve permanent countertop real estate. Everything else should be stored vertically using magnetic wall and fridge grids to keep surfaces serene and reflective.',
      collectionLink: 'https://agentwell.agency#kitchen'
    };
  } else if (niche === 'Digital Planners & iPad') {
    return {
      headline: 'The 3-Priority Rule: How to Plan Daily Without Overwhelm',
      subject: '📱 Day 2: Eliminate Digital Planner Fatigue with the 3-Block Rule',
      tipTitle: 'Daily Time-Box Intentions',
      tipBody: 'Instead of filling 20 micro to-do items, lock in exactly 3 core needle-moving blocks in your GoodNotes daily spread. Time-box them for 90-minute morning focus sessions, and leave afternoons flexible for creative energy flow.',
      collectionLink: 'https://agentwell.agency#planners'
    };
  } else if (niche === 'Printable Wall Art') {
    return {
      headline: 'The 57-Inch Museum Standard: How to Hang Gallery Art Perfectly',
      subject: '🖼️ Day 2: The Interior Designer’s 57-Inch Gallery Wall Secret',
      tipTitle: 'The Eye-Level Formula',
      tipBody: 'The most common gallery wall mistake is hanging prints too high. Museums position the exact vertical center of every framed art piece exactly 57 inches (145 cm) from the floor. This creates harmonious architectural lines with couches, lamps, and neutral walls.',
      collectionLink: 'https://agentwell.agency#wallart'
    };
  } else {
    // Mặc định: Room Decor & Lighting
    return {
      headline: 'The 2700K Warm Glow Formula: Why "The Big Light" Destroys Sleep',
      subject: '✨ Day 2: The 2700K Evening Glow Secret (Room Decor Edit)',
      tipTitle: 'The Sunset Shift at 8:00 PM',
      tipBody: 'Overhead 4000K daylight white lights halt natural melatonin production. Switching exclusively to 2200K–2700K warm filament bulbs and indirect ambient nightstand glow after 8:00 PM signals your nervous system to wind down for deeper, restorative sleep.',
      collectionLink: 'https://agentwell.agency#decor'
    };
  }
}

// 6. TỰ ĐỘNG THIẾT LẬP TRIGGER HÀNG NGÀY (CHỈ CẦN CHỌN HÀM VÀ BẤM RUN)
function setupDailyNurtureTrigger() {
  // Xóa các trigger cũ trùng lặp để tránh gửi 2 lần
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendDay2NurtureEmails') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Tạo Trigger chạy tự động mỗi ngày vào khoảng 9:00 - 10:00 sáng
  ScriptApp.newTrigger('sendDay2NurtureEmails')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  Logger.log('✅ Đã cài đặt thành công Trigger chạy hàng ngày lúc 09:00 sáng cho hàm sendDay2NurtureEmails!');
}

// 7. HÀM TEST THỬ NGAY EMAIL DAY 2 (KHÔNG CẦN CHỜ 48H)
function testSendNurtureNow() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    Logger.log('Bảng tính chưa có dữ liệu.');
    return;
  }

  // Lấy dòng gần nhất có email
  for (var i = data.length - 1; i >= 1; i--) {
    var email = data[i][2];
    var name = data[i][1] || 'Friend';
    var niche = data[i][3] || 'Room Decor & Lighting';

    if (email) {
      Logger.log('Đang gửi test email Day 2 tới: ' + email + ' (Niche: ' + niche + ')');
      sendPersonalizedDay2Email(email, name, niche);
      sheet.getRange(i + 1, 7).setValue('Day2_Sent');
      Logger.log('✅ Đã gửi test thành công và cập nhật status thành Day2_Sent!');
      break;
    }
  }
}
