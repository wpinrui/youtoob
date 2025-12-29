package com.wpinrui.youtoob

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.ui.Modifier
import com.wpinrui.youtoob.ui.GeckoViewScreen
import com.wpinrui.youtoob.ui.theme.YouToobTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            YouToobTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    GeckoViewScreen(modifier = Modifier.padding(innerPadding))
                }
            }
        }
    }
}
