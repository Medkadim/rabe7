plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.wasla.sales"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.wasla.sales"
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
