package dk.husjagt

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.ProgressBar
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsIntent
import androidx.core.content.ContextCompat

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private lateinit var progress: ProgressBar
    private lateinit var error: View

    private val startUrl: String
        get() = getString(R.string.web_url)

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        progress = findViewById(R.id.progress)
        error = findViewById(R.id.error_panel)
        findViewById<Button>(R.id.retry).setOnClickListener { reload() }

        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            builtInZoomControls = true
            displayZoomControls = false
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            mediaPlaybackRequiresUserGesture = false
            setSupportMultipleWindows(true)
            javaScriptCanOpenWindowsAutomatically = true
            allowFileAccess = false
            allowContentAccess = false
            safeBrowsingEnabled = true
            userAgentString = "$userAgentString HusjagtApp/1.0"
        }
        webView.addJavascriptInterface(ShareBridge(), "HusjagtNative")
        webView.webViewClient = HusjagtClient()
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progress.progress = newProgress
                progress.visibility = if (newProgress in 1..99) View.VISIBLE else View.GONE
            }

            override fun onCreateWindow(
                view: WebView?,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: android.os.Message?,
            ): Boolean {
                val transport = resultMsg?.obj as? WebView.WebViewTransport ?: return false
                val probe = WebView(this@MainActivity)
                probe.webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(
                        v: WebView,
                        request: WebResourceRequest,
                    ): Boolean {
                        open(request.url)
                        return true
                    }
                }
                transport.webView = probe
                resultMsg.sendToTarget()
                return true
            }
        }

        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                    }
                }
            },
        )

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
            val deep = intent.data
            if (intent.action == Intent.ACTION_VIEW && deep != null && isAppUrl(deep)) {
                webView.loadUrl(deep.toString())
            }
        } else {
            loadFromIntent(intent)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        loadFromIntent(intent)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onPause() {
        CookieManager.getInstance().flush()
        webView.onPause()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    private fun loadFromIntent(intent: Intent?) {
        val deep = intent?.data
        if (intent?.action == Intent.ACTION_VIEW && deep != null && isAppUrl(deep)) {
            error.visibility = View.GONE
            webView.visibility = View.VISIBLE
            if (!isOnline()) {
                showError()
                return
            }
            webView.loadUrl(deep.toString())
            return
        }
        reload()
    }

    private fun reload() {
        error.visibility = View.GONE
        webView.visibility = View.VISIBLE
        if (!isOnline()) {
            showError()
            return
        }
        webView.loadUrl(startUrl)
    }

    private fun showError() {
        webView.visibility = View.INVISIBLE
        progress.visibility = View.GONE
        error.visibility = View.VISIBLE
    }

    private fun isOnline(): Boolean {
        val cm = getSystemService(ConnectivityManager::class.java) ?: return true
        val network = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(network) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun isAppUrl(uri: Uri): Boolean {
        val host = uri.host?.lowercase() ?: return uri.scheme == "about"
        val appHost = Uri.parse(startUrl).host?.lowercase()
        if (host == appHost) return true
        if (host == "grok.me" || host.endsWith(".grok.me")) return true
        return false
    }

    private fun open(uri: Uri) {
        when (uri.scheme) {
            "http", "https" -> {
                if (isAppUrl(uri)) {
                    webView.loadUrl(uri.toString())
                    return
                }
                val toolbar = ContextCompat.getColor(this, R.color.husjagt_primary)
                val scheme = CustomTabColorSchemeParams.Builder()
                    .setToolbarColor(toolbar)
                    .build()
                CustomTabsIntent.Builder()
                    .setDefaultColorSchemeParams(scheme)
                    .setShowTitle(true)
                    .build()
                    .launchUrl(this, uri)
            }
            "tel", "mailto", "sms", "geo", "maps" -> {
                runCatching {
                    startActivity(Intent(Intent.ACTION_VIEW, uri))
                }
            }
            else -> {
                runCatching {
                    startActivity(Intent(Intent.ACTION_VIEW, uri))
                }
            }
        }
    }

    private inner class ShareBridge {
        @JavascriptInterface
        fun share(title: String, text: String, url: String) {
            runOnUiThread {
                val body = if (text.isBlank()) url else "$text\n$url"
                val send = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_SUBJECT, title)
                    putExtra(Intent.EXTRA_TEXT, body)
                }
                startActivity(Intent.createChooser(send, title))
            }
        }
    }

    private inner class HusjagtClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(
            view: WebView,
            request: WebResourceRequest,
        ): Boolean {
            val uri = request.url
            if (isAppUrl(uri)) return false
            open(uri)
            return true
        }

        override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
            error.visibility = View.GONE
            webView.visibility = View.VISIBLE
        }

        override fun onReceivedError(
            view: WebView,
            request: WebResourceRequest,
            error: WebResourceError,
        ) {
            if (request.isForMainFrame) showError()
        }

        override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
            reload()
            return true
        }
    }
}
