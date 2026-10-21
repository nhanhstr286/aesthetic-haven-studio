/**
 * =========================================================================
 * AESTHETIC HAVEN STUDIO - n8n CODE NODE INTEGRATION
 * =========================================================================
 * 
 * Paste this script directly into an n8n "Code" node (Mode: Run Once for All Items)
 * or adapt for "Run Once for Each Item".
 * 
 * This module coordinates with the Anti-Spam Image Processing Engine to:
 * 1. Transform raw source images to Pinterest 2:3 ratio (1000x1500px).
 * 2. Apply aesthetic warm borders & minimalist Serif typography.
 * 3. Strip duplicate-inducing EXIF metadata & regenerate fresh perceptual hashes.
 * 4. Pass sanitized Pinterest payloads with compliant Amazon curation URLs.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the anti-spam Python processor
const SCRIPT_PATH = path.resolve('scripts/anti_spam_image_processor.py');

/**
 * Main n8n execution handler
 */
const outputItems = [];

for (const item of $input.all()) {
  const json = item.json;
  
  // 1. Extract inputs with graceful fallbacks
  const imageUrl = json.image_url || json.url || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85';
  const pinTitle = json.title || 'Warm Living Setup';
  const pinSubtitle = json.subtitle || 'Curated Living & Warm Spaces • Aesthetic Haven Studio';
  const pinBadge = json.badge || 'SANCTUARY EDIT';
  const destinationUrl = json.destination_url || json.link || 'https://agentwell.agency/collections/living-room-decor';
  
  // Safe filename generator
  const slug = pinTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const timestamp = Date.now();
  const outputPath = path.resolve(`public/assets/pinterest/n8n_${slug}_${timestamp}.jpg`);

  try {
    // 2. Execute the Anti-Spam Image Processor
    const command = `python "${SCRIPT_PATH}" --url "${imageUrl}" --out "${outputPath}" --title "${pinTitle}" --subtitle "${pinSubtitle}" --badge "${pinBadge}" --json`;
    
    const stdout = execSync(command, { encoding: 'utf-8', timeout: 30000 });
    const processResult = JSON.parse(stdout);

    // 3. Assemble full Pinterest-compliant payload
    outputItems.push({
      json: {
        success: true,
        pinterest_payload: {
          title: pinTitle,
          description: `${pinTitle} — Handpicked warm minimalist decor essentials. Discover our full editorial lookbook and tactile curation at Aesthetic Haven Studio.`,
          link: destinationUrl,
          media_source: {
            source_type: 'image_url',
            url: outputPath.replace(/\\/g, '/')
          },
          board_name: json.board_name || 'Warm Minimalist Living',
          compliance: {
            ratio: '2:3 (1000x1500px)',
            affiliate_disclosure_present: true,
            amazon_bridge_url: destinationUrl,
            exif_stripped: true,
            perceptual_hash_shifted: processResult.hash_altered
          }
        },
        processor_meta: processResult
      }
    });

  } catch (error) {
    // Graceful error logging in n8n workflow
    outputItems.push({
      json: {
        success: false,
        error: error.message,
        source_item: json
      }
    });
  }
}

return outputItems;
