
import { UserSession } from "../types";

export class AdsService {
  private initialized = false;

  constructor() {
    this.init();
  }

  async init() {
    if (this.initialized) return;
    // In a real Pi App, the SDK is initialized in index.html or piService via Pi.init
    // The Ads SDK sub-module is available after initialization.
    this.initialized = true;
    console.log("[AdsService] Initialized (Ready to request)");
  }

  /**
   * Displays an Ad if the user is on the FREE tier.
   * @param session Current User Session
   * @param placementId Optional Placement ID for Pi Ads
   */
  async showAd(session: UserSession | null, placementId: string = "interstitial"): Promise<void> {
    if (!session) return;
    
    // 1. Check Tier - ONLY show to FREE users
    if (session.tier !== 'FREE') {
      console.log("[AdsService] Premium User. Ad skipped.");
      return;
    }

    console.log("[AdsService] Free Tier detected. Requesting Ad...");

    // 2. Request & Show Ad
    if (window.Pi && window.Pi.Ads) {
      try {
        const isReady = await window.Pi.Ads.isReady(placementId);
        if (isReady === false) { 
             // Logic to load ad if SDK requires explicit load
             console.log("[AdsService] Ad not ready, attempting request...");
        }
        
        // Mocking the Pi Ads SDK flow as it would appear in the actual Pi Browser
        // const adId = await window.Pi.Ads.requestAd(placementId);
        // await window.Pi.Ads.showAd(adId);
        
        // Since we are in a dev environment without the full Pi Browser context injection:
        throw new Error("Ad SDK mock trigger"); 
        
      } catch (e) {
        // Fallback / Mock Display for Development
        this.mockAdDisplay();
      }
    } else {
        this.mockAdDisplay();
    }
  }

  private mockAdDisplay() {
    // Visual feedback for the "Ad"
    const adOverlay = document.createElement('div');
    adOverlay.id = 'architex-ad-overlay';
    adOverlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;backdrop-filter:blur(10px);animation:fadeIn 0.3s ease-out;";
    adOverlay.innerHTML = `
        <style>
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        </style>
        <div style="background:#1a1a1a;padding:2rem;border-radius:1rem;border:1px solid #00f3ff;text-align:center;max-width:320px;box-shadow:0 0 50px rgba(0,243,255,0.2);animation:slideUp 0.4s ease-out;">
            <div style="font-size:0.7rem;color:#666;text-transform:uppercase;letter-spacing:2px;margin-bottom:0.5rem;">Sponsored Message</div>
            <h3 style="color:#00f3ff;margin-bottom:1rem;font-family:sans-serif;font-weight:bold;font-size:1.5rem;">Architex Free Tier</h3>
            <p style="margin-bottom:1.5rem;color:#ccc;font-size:0.9rem;line-height:1.5;">
                You are currently on the Free Tier. <br/>
                <span style="color:#fff;font-weight:bold;">Watch this short ad to continue.</span>
            </p>
            <div style="width:100%;height:120px;background:#333;margin-bottom:1.5rem;display:flex;align-items:center;justify-content:center;color:#666;border-radius:0.5rem;border:1px dashed #555;">
                [ Pi Network Ad Placeholder ]
            </div>
            <button id="close-ad-btn" style="padding:0.75rem 2rem;background:linear-gradient(90deg, #00f3ff, #0066ff);color:black;border:none;border-radius:0.5rem;font-weight:bold;cursor:pointer;transition:transform 0.1s;">Skip Ad</button>
            <div style="margin-top:1.5rem;font-size:0.75rem;color:#666;border-top:1px solid #333;padding-top:1rem;">
                Tired of ads? <br/><span style="color:#bc13fe;cursor:pointer;">Upgrade to Pro</span>
            </div>
        </div>
    `;
    document.body.appendChild(adOverlay);
    
    document.getElementById('close-ad-btn')?.addEventListener('click', () => {
        adOverlay.remove();
    });
  }
}

export const adsService = new AdsService();
