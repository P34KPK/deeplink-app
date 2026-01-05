# 🚀 Guide de Publication App Store & Google Play

Ce guide vous explique comment transformer votre projet DeepLink en application native et la publier sur les stores.

---

## 📱 Pré-requis Techniques

Avant de commencer, vous devez avoir déployé votre backend/site web (ex: sur Vercel) car l'application mobile se connectera à cette version live.

1.  **Mise à jour de la configuration** :
    *   Ouvrez `capacitor.config.ts`.
    *   Dans `server: { url: ... }`, mettez l'URL HTTPS de votre site (ex: `https://mon-app.vercel.app`).
    *   Exécutez : `npx cap sync`

---

## 🍏 1. Publication sur Apple App Store (iOS)

### Pré-requis :
*   Un Mac avec **Xcode** installé.
*   Un compte **Apple Developer Program** (99$/an).

### Étapes :
1.  **Ouvrir le projet** :
    *   Etape 1 : Dans votre terminal, lancez : `npx cap open ios` (Cela va ouvrir Xcode).
2.  **Configuration du Compte** :
    *   Dans Xcode, cliquez sur le projet "App" (racine, à gauche).
    *   Onglet **Signing & Capabilities**.
    *   Dans "Team", ajoutez votre compte Apple Developer.
    *   Vérifiez que "Bundle Identifier" est unique (ex: `com.votre-nom.deeplink`).
3.  **Assets (Icône & Splash)** :
    *   Dans le dossier `App/Assets.xcassets`, remplacez l'icône par défaut par votre logo (1024x1024 px).
4.  **Archivage (Build)** :
    *   Sélectionnez "Any iOS Device (arm64)" en haut dans la barre de destination.
    *   Menu : **Product > Archive**.
    *   Attendez que la compilation finisse.
5.  **Envoi vers App Store Connect** :
    *   Une fenêtre "Organizer" s'ouvre.
    *   Cliquez sur **Distribute App**.
    *   Choisissez **App Store Connect** -> **Upload**.
    *   Suivez les étapes (Next, Next...) jusqu'à "Upload".
6.  **Fiche App Store** :
    *   Allez sur [App Store Connect](https://appstoreconnect.apple.com).
    *   Créez votre fiche (Titre, Description, Screenshots).
    *   Sélectionnez le "Build" que vous venez d'uploader.
    *   Cliquez sur « Soumettre pour validation » !

---

## 🤖 2. Publication sur Google Play Store (Android)

### Pré-requis :
*   **Android Studio** installé.
*   Un compte **Google Play Console** (25$ frais unique).

### Étapes :
1.  **Ajouter la plateforme Android** (si pas encore fait) :
    *   `npm install @capacitor/android`
    *   `npx cap add android`
2.  **Ouvrir le projet** :
    *   `npx cap open android` (Ouvre Android Studio).
3.  **Générer le Bundle (.aab)** :
    *   Menu : **Build > Generate Signed Bundle / APK**.
    *   Choisissez **Android App Bundle**.
    *   **Key Store Path** : "Create new..." (Créez votre clé secrète, gardez le fichier `.jks` et les mots de passe en lieu sûr ! Si vous perdez ça, vous ne pourrez plus mettre à jour l'app).
    *   Cliquez sur "Finish".
4.  **Récupérer le fichier** :
    *   Une fois fini, une pop-up apparaît. Cliquez sur "Locate". Vous aurez un fichier `app-release.aab`.
5.  **Google Play Console** :
    *   Allez sur [Google Play Console](https://play.google.com/console).
    *   Créez une application.
    *   Remplissez la fiche (détails, images, questions de contenu).
    *   Allez dans **Production**, et uploadez votre fichier `.aab`.
    *   Envoyez pour examen !

---

## 💡 Conseils Importants

*   **Version Code** : À chaque mise à jour, vous DEVEZ augmenter le numéro de version (dans `package.json` ou directement dans Xcode/Android Studio).
*   **Connexion Internet** : Votre app dépend du web. Pensez à gérer le cas "Pas d'internet" (l'utilisateur verra une page blanche sinon). Capacitor a des plugins pour ça.
*   **Review Apple** : Ils sont stricts. Assurez-vous que les liens de "Login" fonctionnent, qu'il y a un moyen de supprimer son compte (obligatoire), et que l'app ne plante pas.

Bonne chance pour le lancement ! 🚀
