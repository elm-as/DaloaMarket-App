# 🤖 Guide de Génération des APKs & Bundles Android

Ce guide explique comment compiler et générer les fichiers **APK** (pour installation directe sur Android) et les fichiers **AAB** (Android App Bundle pour publication sur le Google Play Store).

---

## 1. Prérequis EAS CLI

Installez l'outil Expo Application Services (EAS) mondialement :

```bash
npm install -g eas-cli
```

Connectez-vous à votre compte Expo :
```bash
eas login
```

---

## 2. Compilation des APKs Autonomes (Direct Install)

Chaque application contient un fichier `eas.json` configuré avec le profil `preview` produisant directement un fichier `.apk` installable.

### Générer l'APK DaloaMarket
```bash
cd apps/daloamarket
eas build --profile preview --platform android
```

### Générer l'APK DaloaDelivery
```bash
cd apps/daloadelivery
eas build --profile preview --platform android
```

Une fois la compilation terminée sur les serveurs EAS, un lien de téléchargement direct de l'APK vous est fourni dans la console.

---

## 3. Compilation pour le Google Play Store (Production AAB)

### Générer le Bundle DaloaMarket
```bash
cd apps/daloamarket
eas build --profile production --platform android
```

### Générer le Bundle DaloaDelivery
```bash
cd apps/daloadelivery
eas build --profile production --platform android
```

---

## 4. Compilation Locale (Sans le Cloud EAS)

Si vous disposez d'**Android Studio**, du **JDK 17+** et du **SDK Android** configurés en local :

```bash
# Générer le dossier android natif (prebuild)
npx expo prebuild --platform android

# Compiler l'APK localement avec Gradle
cd android
./gradlew assembleRelease
```
L'APK se trouvera dans `android/app/build/outputs/apk/release/app-release.apk`.
