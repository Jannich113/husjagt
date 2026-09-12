package dk.husjagt

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import dk.husjagt.ui.HusjagtRoot
import dk.husjagt.ui.theme.HusjagtTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            HusjagtTheme {
                HusjagtRoot()
            }
        }
    }
}
