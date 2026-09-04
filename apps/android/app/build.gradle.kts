plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Applied only once real Firebase credentials exist (see docs/DEPLOYMENT.md,
// "Push notifications" section). google-services.json isn't committed to the
// repo, and this plugin hard-fails the whole Gradle build if applied without
// it — conditioning on the file's presence keeps the APK buildable (this app
// and the unrelated sales app, built by the same CI workflow) before the
// user has set Firebase up. The firebase-messaging dependency below stays
// unconditional: without this plugin, Firebase's default app simply never
// initializes at runtime, so it silently no-ops instead of crashing.
if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}

android {
    namespace = "com.wasla.customer"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.wasla.customer"
        // Adaptive icons (mipmap-anydpi-v26) are API 26+, so this app
        // doesn't ship a legacy raster launcher icon at all.
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(platform("com.google.firebase:firebase-bom:33.5.1"))
    implementation("com.google.firebase:firebase-messaging")
}
