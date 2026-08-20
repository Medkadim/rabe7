plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
    // Applied conditionally in app/build.gradle.kts, only once a real
    // google-services.json exists — see the comment there.
    id("com.google.gms.google-services") version "4.4.2" apply false
}
