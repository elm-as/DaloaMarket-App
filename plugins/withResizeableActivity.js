let withAndroidManifest;
try {
  withAndroidManifest = require('expo/config-plugins').withAndroidManifest;
} catch {
  withAndroidManifest = require('@expo/config-plugins').withAndroidManifest;
}

/**
 * Plugin Expo pour activer `android:resizeableActivity="true"` sur MainActivity
 * Conforme aux exigences d'Android 16+ pour le support des grands écrans et appareils pliables.
 */
function withResizeableActivity(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application?.[0];
    if (mainApplication && mainApplication.activity) {
      const mainActivity = mainApplication.activity.find(
        (activity) => activity.$['android:name'] === '.MainActivity'
      );
      if (mainActivity) {
        mainActivity.$['android:resizeableActivity'] = 'true';
      }
    }
    return config;
  });
}

module.exports = withResizeableActivity;
