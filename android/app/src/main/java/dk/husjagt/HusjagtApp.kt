package dk.husjagt

import android.app.Application
import android.webkit.CookieManager
import android.webkit.WebView

class HusjagtApp : Application() {
    override fun onCreate() {
        super.onCreate()
        CookieManager.getInstance().setAcceptCookie(true)
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true)
        }
    }
}
