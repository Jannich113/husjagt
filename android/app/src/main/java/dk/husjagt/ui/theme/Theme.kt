package dk.husjagt.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val Paper = Color(0xFFF1EDE4)
val Surface = Color(0xFFFAF7F0)
val Ink = Color(0xFF161410)
val Muted = Color(0xFF6B645A)
val Pine = Color(0xFF2C4A3E)
val PineFg = Color(0xFFF4F1EA)
val Hairline = Color(0xFFD8D0C4)

private val colors = lightColorScheme(
    primary = Pine,
    onPrimary = PineFg,
    background = Paper,
    onBackground = Ink,
    surface = Surface,
    onSurface = Ink,
    surfaceVariant = Color(0xFFE7E1D6),
    onSurfaceVariant = Muted,
    outline = Hairline,
)

@Composable
fun HusjagtTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = colors, content = content)
}
